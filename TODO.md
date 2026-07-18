# TODO

## Phase 1 - Project Foundation

- [ ] Inisialisasi struktur repository untuk backend dan frontend.
- [ ] Setup backend FastAPI dasar.
- [ ] Setup worker Celery dan Redis.
- [ ] Setup frontend React + Vite.
- [ ] Tambahkan Docker Compose untuk local development.
- [ ] Tambahkan environment template `.env.example`.

## Phase 2 - Connector Builder

- [ ] Buat model konfigurasi connector.
- [ ] Buat endpoint untuk create, update, delete, dan test connector.
- [ ] Dukungan custom method, headers, params, dan body.
- [ ] Simpan sample response untuk kebutuhan mapping.

## Phase 3 - Mapping & Table Builder

- [ ] Parser struktur response JSON.
- [ ] UI pemilihan field.
- [ ] Mapping field ke tipe kolom database.
- [ ] Fitur generate table MySQL dari mapping.
- [ ] Simpan model mapping agar dapat digunakan ulang.

## Phase 4 - Sync Engine

- [ ] Implementasi background job untuk sinkronisasi data.
- [ ] Dukungan pagination berbasis page, offset, atau cursor.
- [ ] Batch insert / upsert ke MySQL.
- [ ] Simpan progress sinkronisasi.
- [ ] Tambahkan retry dan error handling.

## Phase 5 - Job Control & Monitoring

- [ ] Tombol start job.
- [ ] Tombol pause job.
- [ ] Tombol resume job.
- [ ] Tombol stop job.
- [ ] Real-time log monitoring via WebSocket.
- [ ] Progress bar dan statistik sinkronisasi.

## Phase 6 - Quality & Release

- [ ] Tambahkan testing dasar untuk service backend.
- [ ] Tambahkan linting dan formatting.
- [ ] Susun README project.
- [ ] Tambahkan dokumentasi arsitektur.
- [ ] Siapkan pipeline deployment awal.
