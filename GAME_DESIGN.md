# SQL Valley — Dokumen Desain Game

> Game web 2D *top-down* untuk belajar SQL sambil belajar **berpikir seperti analis Business Intelligence (BI)**: pemain berjalan menjelajahi kafe warisannya, bertemu tokoh, dan menyelesaikan tugas dengan menulis SQL di konsol yang tersebar di berbagai sudut kafe.
> Status: desain awal (MVP). Dokumen ini adalah sumber kebenaran untuk keputusan desain — perbarui saat ada keputusan baru.
>
> **Bahasa:** dokumen ini ditulis dalam Bahasa Indonesia, tetapi **semua isi game berbahasa English** (UI, dialog, petunjuk, nama tabel/kolom). Istilah dan contoh in-game di bawah ditulis dalam English.

---

## 1. Visi

Kebanyakan sumber belajar SQL hanya mengajarkan **sintaks**:

- **SQLBolt**: kurva belajar landai dan mudah diikuti, tapi kurang interaktif dan kurang seru.
- **LeetCode**: interaktif, tapi studi kasusnya sering melompat terlalu sulit untuk pemula.

**SQL Valley** mengajarkan SQL dengan kurva landai seperti SQLBolt, dibungkus mekanik game yang membuat pemain ingin lanjut, dan berujung pada kemampuan yang dipakai di dunia kerja: **menjawab pertanyaan bisnis dengan data** — sampai level "sales dropped last month, why?".

## 2. Target pemain

| Pemain | Jalur |
|---|---|
| **Pemula total** (belum pernah menulis SQL) | Mulai dari Chapter 0 (tutorial) |
| **Sudah tahu dasar** | Ikut **Skill Check** di awal → boleh langsung lompat ke chapter yang sesuai |

Target akhir: orang yang ingin berkarier sebagai **analis data / BI**, yang perlu paham SQL *dan* konteks bisnis. Pasar global — karena itu game berbahasa English.

## 3. Konsep & cerita

Pemain mewarisi **kafe milik nenek (Grandma)** di sebuah kota kecil di lembah, yang sedang kesulitan. Catatan kafe tersimpan di database yang berantakan. Pemain berperan sebagai **analis data** bisnis keluarga ini.

- **Fokus: simulasi bisnis**, bukan misteri besar. Cerita berupa episode kecil per chapter.
- Pertanyaan naik kelas mengikuti jenjang karier analis:

| Tahap | Jenis pertanyaan | Contoh (in-game) |
|---|---|---|
| Mengambil data | "Show me…" | "Which menu items cost less than $5?" |
| Melaporkan | "How many / which is the most…" | "What are our top 5 best-sellers this week?" |
| Mengukur KPI | "How are we doing on…" | "Daily revenue, number of orders, and average order value?" |
| Menganalisis | "Why…?" | "October sales dropped 18%. What happened?" |

**Tokoh** (pemberi permintaan): Grandma (pemilik), barista, supplier, pelanggan tetap. Masing-masing punya gaya bicara sendiri.

### Dunia top-down
Game ditampilkan sebagai **dunia 2D dengan kamera dari atas** (genre seperti game simulasi/bertani top-down, dengan visual dan karakter **orisinal**). Skalanya kecil dan fokus — bukan open world besar.

- Pemain **berjalan bebas** di dalam kafe dan sekitarnya, berbicara dengan tokoh untuk menerima tugas.
- **Konsol SQL hanya bisa dibuka di stasiun tertentu.** Di luar stasiun, pemain tidak bisa menulis SQL.
- Setiap stasiun terhubung ke **domain data yang berbeda** — mengajarkan secara alami bahwa data perusahaan tersebar di banyak sistem, dan JOIN adalah cara menyatukannya.

| Lokasi (in-game) | Stasiun / konsol | Tabel yang bisa diakses |
|---|---|---|
| 🧾 Front counter | Cash register | `sales`, `customers` |
| 🍳 Kitchen | Recipe book | `menu_items`, `recipes` |
| 📦 Storeroom | Stock ledger | `inventory`, `suppliers` |
| 🗂 Back office | Grandma's computer | Semua tabel (Analysis Case) |

- **Ruangan terbuka bertahap** mengikuti chapter — membuka ruangan baru adalah bagian dari sistem progres.
- Konsol tampil sebagai **panel overlay** di atas dunia game (dunia tetap terlihat di belakang).

## 4. Core loop (per level)

1. **Request** — pemain menemui tokoh di dunia game; tokoh meminta sesuatu lewat dialog, disertai target yang jelas dan petunjuk stasiun mana yang harus didatangi.
2. **Eksplorasi** — pemain berjalan ke stasiun yang tepat, membuka konsol, lalu melihat daftar tabel, kolom, dan isi tabel.
3. **Query** — pemain menulis SQL lalu menjalankannya; hasil ditampilkan dengan **animasi** (baris tersaring memudar, dua tabel menyatu saat JOIN, baris berkelompok saat GROUP BY).
4. **Validasi** — hasil dibandingkan dengan jawaban benar. Jika salah, umpan balik spesifik (mis. "Your result has 12 rows — expected 3", "Column `price` is missing").
5. **Reward** — koin, XP, dan bintang 1–3.
6. **Kafe tumbuh** — koin dipakai untuk upgrade kafe.

### Validasi jawaban
- Yang dinilai adalah **hasil query**, bukan teks query — banyak cara benar menulis SQL.
- Urutan baris hanya dinilai bila permintaan memang menuntut urutan (ada `ORDER BY` di jawaban).
- Nama kolom/alias dinilai longgar kecuali level secara eksplisit mengajarkan alias.

## 5. Jenis level

| Jenis (in-game) | Deskripsi | Mulai dari |
|---|---|---|
| **Request** | Satu pertanyaan, satu hasil yang benar | Chapter 0 |
| **Report** | Hasil dengan format kolom tertentu (top-N, KPI) | Chapter 2 |
| **Analysis Case** 🎯 | Investigasi terbuka (lihat di bawah) | Chapter 5 |
| **Rush Hour** ⏱ | Mode tantangan berwaktu: permintaan datang bertubi-tubi | Terbuka setelah Chapter 2 |

### Analysis Case (pembeda utama)
- Pemain diberi masalah bisnis terbuka, mis. **"October sales dropped 18%. What happened?"**
- Pemain bebas menjalankan **banyak query** untuk menyelidiki (*drill-down* per menu, hari, jam, kanal penjualan, dst.).
- Pemain menjawab **pertanyaan kesimpulan bertahap** (mis. "Which item dropped the most?", "At what time of day?", "What's the likely cause?").
- Setiap jawaban harus **didukung query bukti** yang disematkan (📌) ke catatan investigasi.
- Data disiapkan agar ada satu cerita penyebab yang konsisten (mis. stok susu sering habis di pagi hari → penjualan latte turun).

## 6. Cara input (bertahap)

| Tahap | Level | Cara |
|---|---|---|
| Blok | Awal Chapter 0 | Menyusun query dari blok kata yang disediakan (seperti puzzle) |
| Isi bagian kosong | Chapter 1 | Query sudah sebagian jadi, pemain mengisi bagian yang hilang |
| Ketik bebas | Chapter 2 dst. | Editor SQL penuh dengan syntax highlighting dan **autocomplete** nama tabel/kolom |

## 7. Peta chapter MVP (± 18–20 level)

| Chapter (in-game) | SQL | Skill bisnis | Input |
|---|---|---|---|
| **0. First Day** | Apa itu tabel, `SELECT`, `FROM` | Mengenali data menu & harga | Blok |
| **1. Cleaning Up the Menu** | `WHERE`, `AND`/`OR`, `IN`, `LIKE`, `IS NULL` | Menyaring data, menemukan **data kotor/kosong** | Isi kosong |
| **2. First Reports** | `ORDER BY`, `LIMIT`, `DISTINCT`, alias, kolom hitungan | Top-N, margin = price − cost | Bebas |
| **3. Numbers Talk** | `COUNT`, `SUM`, `AVG`, `MIN`/`MAX`, `GROUP BY`, `HAVING`, dasar tanggal | **KPI**: revenue, jumlah order, average order value | Bebas |
| **4. Connecting the Dots** | `INNER JOIN`, `LEFT JOIN`, JOIN + agregasi | Penjualan per kategori, pelanggan yang tidak kembali | Bebas |
| **5. The Analysis Case** 🎯 | Gabungan semua materi | Investigasi "sales dropped, why?" | Bebas, multi-query |

Di luar MVP (nanti): subquery, CTE, window function, analisis waktu lanjutan (MoM/YoY), `INSERT`/`UPDATE`, chapter cabang kafe baru.

## 8. Progres & reward

- **XP & level pemain** — dari menyelesaikan level.
- **Bintang per level**: ⭐ benar · ⭐⭐ benar tanpa hint · ⭐⭐⭐ menyelesaikan bonus challenge (mis. tanpa salah, atau syarat tambahan).
- **Koin** — untuk upgrade kafe.
- **Daily streak** 🔥 — main minimal satu level per hari.
- **Hint bertingkat** (maks. 3 per level): arah umum → klausa yang dibutuhkan → hampir jadi. Memakai hint mengurangi bintang, bukan menghalangi progres.
- **Badge** untuk pencapaian (mis. "First JOIN", "True Analyst" setelah Chapter 5).

## 9. Kafe yang tumbuh

- **Penting, tapi sederhana**: kafe di dunia top-down berubah dalam beberapa tahap visual.
- Upgrade dengan koin: kursi bertambah, dekorasi, papan menu baru, pelanggan (NPC) makin ramai berjalan di kafe.
- Ruangan baru (kitchen, storeroom, back office) terbuka mengikuti chapter.
- Kafe yang tumbuh = bukti visual progres belajar pemain.

## 10. Keputusan teknis

| Topik | Keputusan | Alasan |
|---|---|---|
| Platform | **Web app** di browser | Mudah diakses, mudah dibagikan |
| Dunia game | **Game engine 2D untuk web** (kandidat utama: Phaser) + tilemap | Dunia top-down, karakter berjalan, NPC, animasi |
| Konsol SQL | **UI HTML di atas canvas game** (editor kode di DOM) | Editor, autocomplete, dan tabel hasil jauh lebih mudah dibuat dengan HTML daripada di dalam canvas |
| Arsitektur | **Inti SQL terpisah dari dunia game** | Inti SQL (database, validasi, data level) bisa dibangun dan dites lebih dulu, lalu dipanggil oleh dunia game |
| Backend | **Tanpa backend** untuk MVP | Gratis di-hosting, cepat jadi; progres disimpan lokal di browser |
| Engine SQL | **PostgreSQL di browser via PGlite** | Dialek paling dekat dengan dunia kerja BI (Postgres, Redshift, BigQuery, Snowflake) |
| Kompetisi | **Rush Hour + skor terbaik pribadi** | Leaderboard antar pemain menyusul setelah ada backend |
| Bahasa game | **English** (UI, dialog, hint, nama tabel/kolom) | Bisa dimainkan banyak orang, mudah dimengerti, tanpa salah terjemahan; nama tabel English juga sama dengan praktik di dunia kerja |
| Build tool | **Vite** | Server pengembangan cepat, build statis yang mudah di-hosting |
| Bahasa kode | **TypeScript** | Kesalahan nama field/kolom di data level ketahuan sebelum dijalankan |
| UI konsol | **React** | Komponen UI yang mudah dipecah-pecah; banyak sumber belajar; mudah ditempel di atas canvas game nanti |
| Editor SQL | **CodeMirror 6** | Syntax highlighting + autocomplete nama tabel/kolom untuk mode ketik bebas |
| Tes | **Vitest** | Menguji inti SQL (terutama pengecek jawaban) secara otomatis |
| Mata uang | **$ (USD)** | Generik dan mudah dipahami pasar global |

### Struktur kode (Fase 1)
- `src/sql-core/` — database (PGlite), pengecek jawaban, tipe & data level. **Tidak boleh** meng-import React atau game engine.
- `src/console/` — UI konsol (React): editor, input blok, isi kosong, tabel hasil, hint.
- `src/app/` — halaman sederhana: daftar level, alur level, progres (localStorage).

### Pengecek jawaban
- Query pemain dan query jawaban resmi dijalankan di database yang sama; **hasilnya** yang dibandingkan.
- Setiap query pemain berjalan di dalam transaksi **READ ONLY** yang selalu di-*rollback* (data tidak bisa rusak); perintah transaksi (`BEGIN`/`COMMIT`/…) ditolak.
- Batas waktu query (`statement_timeout`) **tidak berfungsi** di PGlite karena berjalan di satu thread. Nanti PGlite dipindah ke Web Worker agar query yang macet bisa dihentikan.

### Format data level
Setiap level adalah objek TypeScript (`src/sql-core/levels/`), satu file per chapter. Isinya:
- `id` (mis. `ch0-1`; dipakai untuk menyimpan progres, jadi tidak boleh diganti setelah rilis), `title`, `character`
- `lesson` (opsional): kartu materi singkat untuk konsep SQL baru di level itu
- `dialogue` (ucapan tokoh) dan `task` (satu kalimat target yang jelas, selalu terlihat saat mengerjakan)
- `input`: `blocks` (daftar blok, boleh ada pengecoh), `fill-blank` (template dengan `___`), atau `free`
- `solution` (query jawaban resmi; hanya hasilnya yang dibandingkan), `check` (opsi pengecek), `hints` (tepat 3), `success` (ucapan setelah benar)

Tes otomatis memeriksa semua level: jawaban resmi bisa dijalankan, blok yang disediakan cukup untuk menyusun jawaban, dan blok tidak ditampilkan dalam urutan jawaban.

## 11. Data game

- Database kafe dibuat **realistis**: `menu_items` (kategori, harga & cost), `sales` per transaksi (dengan tanggal & jam), `customers`, `employees`/shift, `inventory`, `suppliers`, kanal penjualan (dine-in, takeaway, delivery app).
- Semua nama tabel dan kolom dalam English, gaya `snake_case`.
- Sengaja diberi **data kotor** (nilai kosong, duplikat, salah ketik) di level tertentu — karena itu kenyataan di dunia kerja.
- Data Analysis Case dirancang dengan pola tersembunyi yang bisa ditemukan lewat query.

## 12. Roadmap

Dibangun bertahap — setiap fase menghasilkan sesuatu yang bisa dimainkan.

| Fase | Isi | Selesai jika… |
|---|---|---|
| **1. Inti SQL** | PGlite + data kafe, pengecek jawaban, format data level, konsol SQL (input blok → isi kosong → bebas), Chapter 0–1 | Chapter 0–1 bisa dimainkan lengkap di halaman sederhana, dan rasa belajarnya sudah enak |
| **2. Dunia pertama** | Game engine, satu ruangan (area depan + front counter), karakter berjalan, Grandma sebagai NPC, dialog, konsol terbuka dari stasiun | Pemain bisa jalan → bicara dengan Grandma → ke cash register → menyelesaikan level Chapter 0–1 di dalam dunia game |
| **3. Kafe tumbuh** | Kitchen, storeroom, back office; Chapter 2–5; koin, upgrade, bintang, streak, Rush Hour, Analysis Case | MVP lengkap Chapter 0–5 |
| **Nanti** | Skill Check, materi lanjutan, leaderboard (butuh backend), audio, polesan | — |

## 13. Pertanyaan terbuka

- [x] Framework UI konsol — **React** (diputuskan di perencanaan Fase 1)
- [ ] Game engine final (kandidat: Phaser) — diputuskan saat perencanaan Fase 2
- [ ] Gaya visual (mis. pixel art) dan sumber aset — sprite/tileset orisinal atau asset pack berlisensi jelas
- [ ] Kontrol: keyboard (WASD/panah) saja, atau juga klik/tap untuk berjalan (mobile)?
- [x] Mata uang — **$ (USD)**
- [ ] Nuansa setting kota (generik/internasional, atau ada sentuhan lokal tertentu)
- [ ] Isi detail tiap level (dialog, data, jawaban) per chapter — Chapter 0 sudah ditulis (4 level)
- [ ] **Stasiun untuk Chapter 0–1**: level Chapter 0–1 memakai `menu_items`, yang menurut §3 ada di Kitchen. Padahal Fase 2 hanya membangun front counter (cash register: `sales`, `customers`). Pilihan: cash register juga bisa membaca `menu_items` (realistis, kasir perlu harga menu), atau Kitchen ikut dibangun di Fase 2. Diputuskan saat perencanaan Fase 2.
- [ ] Bentuk Skill Check (berapa soal, bagaimana menentukan chapter awal)
- [ ] Hosting (mis. GitHub Pages / Vercel / Netlify)
