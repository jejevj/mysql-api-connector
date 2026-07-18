"""Script untuk patch field_mappings model ID 1 (zawa_keluarga)
Jalankan: docker compose exec api python seed_model1.py
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.model_mapping import ModelMapping
from sqlalchemy.orm.attributes import flag_modified

# Semua kolom tabel zawa_keluarga yang bisa di-mapping dari API
# Kolom: id, raw_data, synced_at, created_at, updated_at -- SKIP (internal)
FIELD_MAPPINGS = [
    {"source": "nomor_kartu_keluarga",              "target": "nomor_kartu_keluarga",              "type": "VARCHAR(20)",  "nullable": True},
    {"source": "nama_anggota_keluarga",             "target": "nama_anggota_keluarga",             "type": "VARCHAR(255)", "nullable": True},
    {"source": "jumlah_anggota_keluarga",           "target": "jumlah_anggota_keluarga",           "type": "INT",          "nullable": True},
    {"source": "alamat",                            "target": "alamat",                            "type": "TEXT",         "nullable": True},
    {"source": "kelurahan_desa",                    "target": "kelurahan_desa",                    "type": "VARCHAR(100)", "nullable": True},
    {"source": "kecamatan",                         "target": "kecamatan",                         "type": "VARCHAR(100)", "nullable": True},
    {"source": "kabupaten_kota",                    "target": "kabupaten_kota",                    "type": "VARCHAR(100)", "nullable": True},
    {"source": "provinsi",                          "target": "provinsi",                          "type": "VARCHAR(100)", "nullable": True},
    {"source": "kode_provinsi",                     "target": "kode_provinsi",                     "type": "VARCHAR(10)",  "nullable": True},
    {"source": "kode_kabupaten_kota",               "target": "kode_kabupaten_kota",               "type": "VARCHAR(10)",  "nullable": True},
    {"source": "kode_kecamatan",                    "target": "kode_kecamatan",                    "type": "VARCHAR(10)",  "nullable": True},
    {"source": "kode_kelurahan_desa",               "target": "kode_kelurahan_desa",               "type": "VARCHAR(15)",  "nullable": True},
    {"source": "luas_lantai",                       "target": "luas_lantai",                       "type": "INT",          "nullable": True},
    {"source": "jenis_lantai_terluas",              "target": "jenis_lantai_terluas",              "type": "INT",          "nullable": True},
    {"source": "jenis_dinding_terluas",             "target": "jenis_dinding_terluas",             "type": "INT",          "nullable": True},
    {"source": "jenis_atap_terluas",                "target": "jenis_atap_terluas",                "type": "INT",          "nullable": True},
    {"source": "status_kepemilikan_rumah",          "target": "status_kepemilikan_rumah",          "type": "VARCHAR(5)",   "nullable": True},
    {"source": "fasilitas_bab",                     "target": "fasilitas_bab",                     "type": "VARCHAR(5)",   "nullable": True},
    {"source": "jenis_kloset",                      "target": "jenis_kloset",                      "type": "VARCHAR(5)",   "nullable": True},
    {"source": "pembuangan_akhir_tinja",            "target": "pembuangan_akhir_tinja",            "type": "VARCHAR(5)",   "nullable": True},
    {"source": "sumber_air_minum_utama",            "target": "sumber_air_minum_utama",            "type": "INT",          "nullable": True},
    {"source": "sumber_penerangan_utama",           "target": "sumber_penerangan_utama",           "type": "VARCHAR(5)",   "nullable": True},
    {"source": "bahan_bakar_utama_memasak",         "target": "bahan_bakar_utama_memasak",         "type": "INT",          "nullable": True},
    {"source": "daya_terpasang",                    "target": "daya_terpasang",                    "type": "INT",          "nullable": True},
    {"source": "id_pelanggan_pln",                  "target": "id_pelanggan_pln",                  "type": "VARCHAR(20)",  "nullable": True},
    {"source": "aset_bergerak_sepeda_motor",        "target": "aset_bergerak_sepeda_motor",        "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_mobil",               "target": "aset_bergerak_mobil",               "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_sepeda",              "target": "aset_bergerak_sepeda",              "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_perahu",              "target": "aset_bergerak_perahu",              "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_kapal_perahu_motor",  "target": "aset_bergerak_kapal_perahu_motor",  "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_smartphone",          "target": "aset_bergerak_smartphone",          "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_komputer_laptop_tablet", "target": "aset_bergerak_komputer_laptop_tablet", "type": "VARCHAR(5)", "nullable": True},
    {"source": "aset_bergerak_tv_datar",            "target": "aset_bergerak_tv_datar",            "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_lemari_es",           "target": "aset_bergerak_lemari_es",           "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_ac",                  "target": "aset_bergerak_ac",                  "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_pemanas_air",         "target": "aset_bergerak_pemanas_air",         "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_tabung_gas",          "target": "aset_bergerak_tabung_gas",          "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_telepon_rumah",       "target": "aset_bergerak_telepon_rumah",       "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_bergerak_emas_perhiasan",      "target": "aset_bergerak_emas_perhiasan",      "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_tidak_bergerak_rumah_lainnya", "target": "aset_tidak_bergerak_rumah_lainnya", "type": "VARCHAR(5)",   "nullable": True},
    {"source": "aset_tidak_bergerak_lahan_lainnya", "target": "aset_tidak_bergerak_lahan_lainnya", "type": "VARCHAR(5)",   "nullable": True},
    {"source": "kepemilikan_aset",                  "target": "kepemilikan_aset",                  "type": "VARCHAR(5)",   "nullable": True},
    {"source": "jumlah_ternak_sapi",                "target": "jumlah_ternak_sapi",                "type": "INT",          "nullable": True},
    {"source": "jumlah_ternak_kerbau",              "target": "jumlah_ternak_kerbau",              "type": "INT",          "nullable": True},
    {"source": "jumlah_ternak_kuda",                "target": "jumlah_ternak_kuda",                "type": "INT",          "nullable": True},
    {"source": "jumlah_ternak_kambing_domba",       "target": "jumlah_ternak_kambing_domba",       "type": "INT",          "nullable": True},
    {"source": "jumlah_ternak_babi",                "target": "jumlah_ternak_babi",                "type": "INT",          "nullable": True},
    {"source": "pbi_nas",                           "target": "pbi_nas",                           "type": "VARCHAR(5)",   "nullable": True},
    {"source": "pbi_pemda",                         "target": "pbi_pemda",                         "type": "VARCHAR(5)",   "nullable": True},
    {"source": "desil_nasional",                    "target": "desil_nasional",                    "type": "VARCHAR(5)",   "nullable": True},
]

UPSERT_KEYS = ["nomor_kartu_keluarga"]

if __name__ == "__main__":
    db = SessionLocal()
    try:
        m = db.query(ModelMapping).filter(ModelMapping.id == 1).first()
        if not m:
            print("ERROR: Model ID 1 tidak ditemukan!")
            sys.exit(1)

        m.field_mappings = FIELD_MAPPINGS
        m.upsert_keys = UPSERT_KEYS
        flag_modified(m, 'field_mappings')
        flag_modified(m, 'upsert_keys')
        db.commit()
        db.refresh(m)

        print(f"OK! field_mappings count : {len(m.field_mappings)}")
        print(f"OK! upsert_keys          : {m.upsert_keys}")
    finally:
        db.close()
