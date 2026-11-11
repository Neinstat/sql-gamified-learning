# CLAUDE.md

Project: **Kafe Warisan** — game web 2D top-down untuk belajar SQL dengan fokus cara berpikir analis BI. Pemain berjalan di kafe dan menulis SQL di konsol pada stasiun tertentu.

- Semua keputusan desain ada di `GAME_DESIGN.md`. Baca dulu sebelum merancang atau membangun fitur, dan perbarui file itu bila ada keputusan desain baru.
- Pemilik project sedang belajar Claude Code dan git: jelaskan langkah dalam Bahasa Indonesia, dengan singkat dan jelas.
- Konten game (dialog, UI, petunjuk) berbahasa Indonesia; nama tabel/kolom database juga berbahasa Indonesia (mis. `menu`, `penjualan`).
- Dialek SQL yang diajarkan: PostgreSQL (dijalankan di browser via PGlite). Tanpa backend untuk MVP.
- Arsitektur: **inti SQL** (database, validasi jawaban, data level) dipisah dari **dunia game** (engine 2D, peta, NPC). Inti SQL tidak boleh bergantung pada kode game engine.
- Ikuti roadmap fase di `GAME_DESIGN.md` §12 — jangan mengerjakan fitur fase berikutnya sebelum fase berjalan selesai, kecuali diminta.
- Visual dan karakter harus orisinal; aset pihak ketiga hanya yang lisensinya jelas, dan catat sumber + lisensinya.
- Kerja dalam iterasi kecil: satu fitur → verifikasi di browser → commit.
