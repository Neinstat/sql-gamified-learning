# CLAUDE.md

Project: **SQL Valley** — game web **3D orang pertama** untuk belajar SQL dengan fokus cara berpikir analis BI. Pemain bekerja di food truck **Rolling Roast** yang parkir di taman kota: pelanggan antre membawa pesanan yang dijawab dengan SQL di tablet, dan **The Manager** (berjas, bossy) sesekali mengetuk pintu dengan pertanyaan BI. Dunia dibuat dengan **Three.js** dan digambar lewat **shader risograf** (tinta terbatas, dither, garis tepi, garis merah "meleset"). Lihat `GAME_DESIGN.md` §14 dan riwayat desain di `docs/JOURNEY.md`. Kode versi lama (kafe top-down v1 dan prototipe truck 2D) sudah dihapus; hanya ada di tag git `v1-cafe-mvp` dan `v2-prototypes`.

- Semua keputusan desain ada di `GAME_DESIGN.md`. Baca dulu sebelum merancang atau membangun fitur, dan perbarui file itu bila ada keputusan desain baru.
- Pemilik project sedang belajar Claude Code dan git: jelaskan langkah dalam Bahasa Indonesia, dengan singkat dan jelas.
- **Bahasa game: English sebagai bahasa utama, Bahasa Indonesia sebagai pilihan pemain.** Teks cerita & UI (dialog, kartu materi, task, hint, umpan balik, tombol) ditulis dulu dalam English, lalu diterjemahkan ke Indonesia di file terpisah (`locales/id/`); bila terjemahan belum ada, otomatis memakai English. **Selalu English (tidak diterjemahkan):** kata kunci SQL, nama tabel/kolom (`snake_case`, mis. `menu_items`, `sales`), isi data, dan pesan error PostgreSQL. README juga English. Dokumen desain dan percakapan dengan pemilik project tetap Bahasa Indonesia.
- Dialek SQL yang diajarkan: PostgreSQL (dijalankan di browser via PGlite). Tanpa backend untuk MVP.
- Arsitektur: **inti SQL** (`src/sql-core/`: database, validasi jawaban, data level, pesanan) dipisah dari **dunia game** (`src/game/`: Three.js, tanpa React). Inti SQL tidak boleh bergantung pada kode game; dunia game dan React hanya terhubung lewat `src/game/truck/bridge.ts`.
- Ikuti roadmap fase di `GAME_DESIGN.md` §14.9 — jangan mengerjakan fitur fase berikutnya sebelum fase berjalan selesai, kecuali diminta.
- Visual dan karakter harus orisinal; aset pihak ketiga hanya yang lisensinya jelas, dan catat sumber + lisensinya (`CREDITS.md`). Status gambar/model sementara dicatat di `docs/ASSETS.md`.
- Kerja dalam iterasi kecil: satu fitur → verifikasi di browser → commit.
- Git: **jangan tambahkan baris `Co-Authored-By` atau atribusi Claude apa pun** di pesan commit maupun deskripsi PR.
