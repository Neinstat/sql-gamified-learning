# SQL Gamified Learning

Game interaktif untuk belajar SQL — seru dimainkan, dengan kurva belajar yang landai.

## Kenapa project ini ada

- **SQLBolt**: kurva belajarnya enak diikuti, tapi kurang interaktif dan kurang seru.
- **LeetCode**: interaktif, tapi beberapa soal studi kasusnya melompat terlalu sulit untuk pemula.

Project ini mencoba mengisi celah di antaranya: materi bertahap seperti SQLBolt, dibungkus mekanik game yang membuat pemain ingin terus lanjut.

## Status

📐 Desain selesai, menuju Fase 1 (inti SQL). Detail lengkap di [GAME_DESIGN.md](GAME_DESIGN.md).

## Konsep: Kafe Warisan

Kamu mewarisi kafe nenek dan berperan sebagai analis datanya. Jelajahi kafe dalam dunia 2D *top-down*, terima tugas dari para tokoh, lalu selesaikan dengan SQL di konsol yang tersebar di kasir, dapur, gudang, dan kantor — dari "tampilkan daftar menu" sampai "penjualan bulan lalu turun, kenapa?".

- Web app, berjalan sepenuhnya di browser
- Query dieksekusi oleh PostgreSQL sungguhan di browser (PGlite), tanpa backend
- Materi bertahap dari `SELECT` dasar hingga `JOIN`, agregasi, dan kasus analisis bisnis
