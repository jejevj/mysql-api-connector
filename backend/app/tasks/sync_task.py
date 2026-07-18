import httpx
import pymysql
import json
import time
from celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.job import SyncJob
from app.models.model_mapping import ModelMapping
from app.models.connector import Connector
import redis
from datetime import datetime

r = redis.from_url(settings.REDIS_URL, decode_responses=True)


def _get_nested(data: dict, path: str):
    """Ambil nilai nested dari dict berdasarkan dot-notation path."""
    keys = path.split(".")
    for key in keys:
        if isinstance(data, dict):
            data = data.get(key)
        else:
            return None
    return data


def _push_log(job_id: int, level: str, message: str):
    payload = json.dumps({"level": level, "message": message, "time": datetime.utcnow().isoformat()})
    r.publish(f"job_logs:{job_id}", payload)


def _upsert_batch(conn, table: str, field_mappings: list, upsert_keys: list, items: list):
    if not items:
        return 0

    columns = [f['target'] for f in field_mappings]
    source_keys = [f['source'] for f in field_mappings]
    placeholders = ", ".join(["%s"] * len(columns))
    col_names = ", ".join([f"`{c}`" for c in columns])
    update_clause = ", ".join([f"`{c}`=VALUES(`{c}`)"
                               for c in columns if c not in upsert_keys])

    sql = f"""
        INSERT INTO `{table}` ({col_names})
        VALUES ({placeholders})
        ON DUPLICATE KEY UPDATE {update_clause};
    """

    rows = []
    for item in items:
        row = tuple(item.get(src) for src in source_keys)
        rows.append(row)

    with conn.cursor() as cursor:
        cursor.executemany(sql, rows)
    conn.commit()
    return len(rows)


@celery_app.task(bind=True)
def run_sync(self, job_id: int):
    db = SessionLocal()
    try:
        job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        if not job:
            return

        model: ModelMapping = job.model_mapping
        connector: Connector = model.connector

        _push_log(job_id, "INFO", f"Sync job {job_id} started")

        conn = pymysql.connect(
            host=model.target_db_host,
            port=model.target_db_port,
            user=model.target_db_user,
            password=model.target_db_password,
            database=model.target_db_name,
        )

        cursor_value = job.current_cursor
        page = job.current_page or 1
        total_processed = job.processed_items or 0

        while True:
            state = r.get(f"job_state:{job_id}")

            if state == "stopped":
                _push_log(job_id, "WARN", "Job dihentikan oleh user.")
                job.status = "stopped"
                job.finished_at = datetime.utcnow()
                db.commit()
                break

            if state == "paused":
                _push_log(job_id, "INFO", "Job dijeda. Menunggu resume...")
                time.sleep(2)
                continue

            params = dict(connector.query_params or {})
            if connector.pagination_type == "cursor" and cursor_value:
                params["cursor"] = cursor_value
            elif connector.pagination_type == "page":
                params[connector.pagination_param] = page

            try:
                with httpx.Client(timeout=30) as client:
                    response = client.request(
                        method=connector.method,
                        url=connector.url,
                        headers=connector.headers or {},
                        params=params,
                        json=connector.body if connector.method in ["POST", "PUT"] else None,
                    )
                data = response.json()
            except Exception as e:
                _push_log(job_id, "ERROR", f"Request error: {str(e)}")
                job.status = "error"
                job.error_message = str(e)
                db.commit()
                break

            items = _get_nested(data, connector.data_path) or []
            total = _get_nested(data, connector.total_path) or 0
            next_cursor = _get_nested(data, connector.cursor_path) if connector.cursor_path else None

            if not items:
                _push_log(job_id, "INFO", "Tidak ada item lagi. Sync selesai.")
                break

            batch_count = _upsert_batch(conn, model.target_table, model.field_mappings, model.upsert_keys, items)
            total_processed += batch_count

            job.processed_items = total_processed
            job.total_items = total
            job.current_cursor = next_cursor
            job.current_page = page
            db.commit()

            _push_log(job_id, "INFO", f"Batch done: {batch_count} items. Total: {total_processed}/{total}")

            if connector.pagination_type == "cursor":
                if not next_cursor:
                    _push_log(job_id, "INFO", "Cursor habis. Sync selesai.")
                    break
                cursor_value = next_cursor
            elif connector.pagination_type == "page":
                has_next = _get_nested(data, "data.hasNextPage")
                if not has_next:
                    break
                page += 1
            else:
                break

        job.status = "done"
        job.finished_at = datetime.utcnow()
        db.commit()
        _push_log(job_id, "INFO", f"Sync job {job_id} selesai. Total: {total_processed} items.")
        conn.close()

    except Exception as e:
        _push_log(job_id, "ERROR", f"Fatal error: {str(e)}")
        job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
        if job:
            job.status = "error"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()
