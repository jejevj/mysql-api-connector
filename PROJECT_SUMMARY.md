# MySQL API Connector

MySQL API Connector adalah aplikasi untuk mengambil data dari API eksternal dengan konfigurasi request yang fleksibel, lalu menyimpan hasilnya ke database MySQL secara terstruktur.

## Tujuan

Project ini dirancang untuk menjadi semacam ETL tool ringan berbasis web dengan kemampuan:

- Menjalankan request HTTP seperti Postman dengan method, header, query, dan body yang dapat dikustomisasi.
- Menyimpan konfigurasi konektor API agar bisa digunakan ulang.
- Membaca struktur response JSON dan membantu pemilihan field yang ingin disimpan.
- Membuat tabel MySQL dari field yang dipilih user.
- Melakukan sinkronisasi data secara bertahap dengan dukungan upsert.
- Menyediakan kontrol sinkronisasi seperti start, pause, resume, dan stop.
- Menampilkan log monitoring dan progress sinkronisasi secara real-time.

## Ruang Lingkup Awal

Tahap awal project akan difokuskan pada:

1. Setup struktur project backend dan frontend.
2. Menyusun arsitektur service untuk connector, model mapping, dan sync engine.
3. Menyusun dokumen perencanaan implementasi.
4. Menyiapkan fondasi agar deployment lokal mudah dilakukan dengan Docker Compose.

## Gambaran Arsitektur

Komponen utama yang direncanakan:

- Frontend web app untuk konfigurasi request, mapping field, dan monitoring job.
- Backend API untuk menyimpan konfigurasi, menguji request, dan mengelola job sinkronisasi.
- Worker background untuk proses sync yang berjalan lama.
- Redis untuk broker queue, state job, dan log streaming.
- MySQL untuk metadata aplikasi dan target penyimpanan data hasil sinkronisasi.

## Catatan

Dokumen ini adalah ringkasan awal project. Detail implementasi bertahap akan dipecah dalam TODO dan milestone teknis berikutnya.
