# Checklist uji main — MVP (Fase 1–3)

Checklist untuk menguji seluruh game secara manual. Fase 1–3 sudah dinyatakan selesai (16 Nov 2026) tanpa uji main menyeluruh; pakai checklist ini kapan saja, dan temuannya diperbaiki sebagai iterasi kecil (lihat `GAME_DESIGN.md` §12).
Centang yang sudah aman; catat yang janggal beserta level atau ruangannya (mis. "ch3-4: hint 2 membingungkan").

**Persiapan:** `npm run dev`, lalu buka http://localhost:5173.
Lompat ke level tertentu dengan `?level=`, mis. `http://localhost:5173/?level=ch3-1`. Journal → **Start over** mengulang dari nol.

## A. Awal permainan (pemain baru)
- [ ] Kartu sambutan Grandma muncul dengan dua pilihan: mulai dari awal, atau Skill Check
- [ ] Skill Check: soal bisa dikerjakan, "I don't know this one" bekerja, hasilnya menempatkan di chapter yang tepat
- [ ] Chapter yang dilewati Skill Check tetap terbuka di Journal (tanpa bintang)
- [ ] Mulai dari awal: kartu Chapter 0 → "!" di atas Grandma

## B. Dunia game dan kontrol
- [ ] Jalan dengan WASD/panah dan klik/tap lantai
- [ ] Klik tokoh atau stasiun → pemain berjalan ke sana lalu **langsung** membuka dialog/konsol (catat bila masih harus menekan E)
- [ ] Gelembung "…" muncul tepat di atas tokoh atau stasiun terdekat
- [ ] Zoom − / + dan scroll mouse bekerja
- [ ] Panah emas muncul di tepi layar saat tujuan tidak terlihat

## C. Alur belajar per chapter
Untuk setiap chapter: dialog enak dibaca? kartu materi cukup? hint 1 → 3 makin membantu? ada lompatan kesulitan?

- [ ] Ch0 (`ch0-1`) — susun blok, query pertama
- [ ] Ch1 (`ch1-1`) — isi bagian kosong, `WHERE`, `IS NULL`
- [ ] Ch2 (`ch2-1`) — ketik bebas pertama kali, `ORDER BY`, `LIMIT`, alias; di ch2-5, jebakan NULL saat `DESC` terasa adil?
- [ ] Ch3 (`ch3-1`) — Cash register, `COUNT`, `SUM`, `GROUP BY`, `HAVING`, tanggal
- [ ] Ch4 (`ch4-1`) — Kitchen terbuka, `JOIN` dan `LEFT JOIN`
- [ ] Ch5 (`ch5-1`) — Storeroom dan Back office terbuka
- [ ] Umpan balik jawaban salah jelas (mis. "Column `price` is missing")
- [ ] Lupa `;` mendapat pesan ramah

## D. Berpikir seperti analis (nilai jual utama)
- [ ] "So what?" muncul setelah melapor (mis. `ch0-4`, `ch2-4`, `ch3-5`) dan terasa bermakna
- [ ] Mini Case (`ch1-7`, `ch2-6`, `ch3-7`, `ch4-7`): memuat query awal, menjalankan, dan menyematkan 📌 dipahami tanpa dijelaskan
- [ ] Pesan "bukti kurang" / "terlalu luas" bisa dimengerti
- [ ] Cerita tiap Mini Case masuk akal
- [ ] Analysis Case (`ch5-3`) bisa diselesaikan hanya dengan petunjuk yang ada
- [ ] Analysis Case terasa seperti investigasi (berapa → apa → kapan → kenapa), dan momen "aha" soal susu memuaskan
- [ ] Pesan penutup muncul setelah Analysis Case selesai

## E. Ruangan dan navigasi
- [ ] Pintu bergembok sebelum waktunya; terbuka di chapter yang tepat (Kitchen Ch4, Storeroom & Back office Ch5)
- [ ] Papan nama pintu terbaca dan tidak menutupi apa pun
- [ ] Pindah ruangan: ada fade singkat, ruangan lain tidak terlihat di tepi layar
- [ ] Tugas di ruangan lain → "!" muncul di pintu yang benar
- [ ] Journal → Café map: ruangan terkunci, 📍 posisi, ❗ tugas berikutnya tampil benar
- [ ] Query ke tabel stasiun lain ditolak dengan pesan jelas (mis. `SELECT * FROM sales;` di Menu board)

## F. Reward dan kafe yang tumbuh
- [ ] Bintang dan koin tampil di layar hasil; aturan ⭐⭐⭐ (tanpa hint dan tanpa salah) terasa adil
- [ ] Bintang tampil di Journal (per level dan total per chapter)
- [ ] Toko (tekan 🪙): beli upgrade → kafe berubah (tanaman, karpet, meja, papan menu, pelanggan berjalan)
- [ ] Harga upgrade terasa pas
- [ ] Badge 🏅 muncul sebagai notifikasi dan tampil di tab Badges
- [ ] 🔥 Streak bertambah saat bermain di hari berikutnya

## G. Rush Hour
- [ ] Terkunci sebelum Chapter 2 selesai, lalu terbuka di Journal
- [ ] Timer, skor, dan kombo berjalan; "Lewati" mereset kombo
- [ ] ✕ mengakhiri putaran lebih awal; rekor tersimpan
- [ ] Durasi 150 detik terasa pas

## H. Konsol dan teknis
- [ ] Autocomplete nama tabel/kolom bekerja
- [ ] Query besar (`SELECT * FROM sales;`) hanya menampilkan 200 baris pertama, halaman tidak macet
- [ ] Query lambat bisa dihentikan dengan **■ Stop**
- [ ] Tanggal/jam tampil benar (mis. `2026-08-01 07:16:02`)
- [ ] Muat ulang halaman: progres, koin, dan upgrade tetap tersimpan
- [ ] Journal → Start over: mulai dari nol, kartu sambutan muncul lagi

## I. Bahasa
- [ ] Ganti EN ↔ ID di dialog, kartu materi, Mini Case, toko, badge, Rush Hour
- [ ] Tidak ada teks Indonesia yang janggal; SQL dan nama kolom tetap English

## J. Di HP (atau mode HP di browser)
- [ ] Berjalan dengan tap, zoom bekerja
- [ ] Konsol, Mini Case, toko, Journal (termasuk Café map), dan Rush Hour bisa dipakai tanpa tergencet
- [ ] Header (🔥, 🪙, Journal, EN/ID) muat di layar

## Kesan umum
- [ ] Rasa "berpikir seperti analis BI" sudah terasa sejak awal?
- [ ] Bagian paling seru, dan paling membosankan atau membingungkan:
- [ ] Ada bug yang membuat tidak bisa lanjut?

## Catatan temuan

| Tempat (level/ruangan) | Temuan | Seberapa penting |
|---|---|---|
| | | |
