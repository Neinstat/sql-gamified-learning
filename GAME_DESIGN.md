# SQL Valley — Dokumen Desain Game

> Game web 2D *top-down* untuk belajar SQL sambil belajar **berpikir seperti analis Business Intelligence (BI)**: pemain berjalan menjelajahi kafe warisannya, bertemu tokoh, dan menyelesaikan tugas dengan menulis SQL di konsol yang tersebar di berbagai sudut kafe.
> Status: desain awal (MVP). Dokumen ini adalah sumber kebenaran untuk keputusan desain — perbarui saat ada keputusan baru.
>
> **Bahasa:** dokumen ini ditulis dalam Bahasa Indonesia. Game memakai **English sebagai bahasa utama** dengan **pilihan Bahasa Indonesia** untuk teks cerita & UI; SQL, nama tabel/kolom, dan isi data selalu English (lihat §10). Istilah dan contoh in-game di bawah ditulis dalam English.

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

Target akhir: orang yang ingin berkarier sebagai **analis data / BI**, yang perlu paham SQL *dan* konteks bisnis. Pasar global — karena itu bahasa utama game English, dengan pilihan Bahasa Indonesia agar pemula di Indonesia mudah masuk.

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
| 🪧 Front area | Menu board (papan menu) | `menu_items` |
| 🧾 Front counter | Cash register | `sales`, `customers` |
| 🍳 Kitchen | Recipe book | `recipes` (+ `menu_items` untuk JOIN) |
| 📦 Storeroom | Stock ledger | `inventory`, `suppliers` |
| 🗂 Back office | Grandma's computer | Semua tabel (Analysis Case) |

- **Ruangan terbuka bertahap** mengikuti chapter — membuka ruangan baru adalah bagian dari sistem progres.
- Konsol tampil sebagai **panel overlay** di atas dunia game (dunia tetap terlihat di belakang).
- **Kontrol:** keyboard (WASD/panah untuk berjalan, E/Spasi untuk bicara/membuka stasiun) **dan** klik/tap tujuan untuk berjalan (pathfinding di grid), sehingga bisa dimainkan di desktop maupun HP. Klik/tap pada NPC atau stasiun = berjalan ke sana lalu berinteraksi. Klik pada benda/dinding = berjalan ke tile terdekat yang bisa dicapai. Jalur boleh diagonal tapi tidak memotong sudut; menekan tombol arah membatalkan jalur klik.

### Gaya visual & aset
- **Pixel art cozy** ala game simulasi/bertani top-down — hanya *konvensi ukurannya* yang diikuti; gambar, karakter, dan warna tetap **orisinal**.

| Jenis aset | Ukuran (px) | Keterangan |
|---|---|---|
| Tile peta (lantai, dinding, rumput, jalan) | 16×16 | Satu kotak grid |
| Item & ikon kecil | 16×16 | Ikon menu, cangkir, dll. |
| Karakter (pemain & NPC) | 16×32 | Tinggi dua tile |
| Potret dialog | 64×64 | Wajah tokoh di kotak dialog |
| Objek tinggi & furnitur | 16×32 atau 32×32 | Counter, mesin kopi, rak, papan menu |

- Ditampilkan dengan **zoom bulat** (mis. 3×) dan `pixelArt: true` agar piksel tetap tajam. Zoom minimal 2× (maks. 4×): di layar kecil kamera mengikuti pemain, bukan memperkecil ruangan.
- Hanya **kaki** karakter yang bertabrakan (kepala boleh menutupi benda di belakangnya); benda yang lebih bawah di layar digambar di depan.
- **Sumber aset Fase 2: placeholder.** Tile dari pack **CC0** (kandidat: Kenney, 16×16) dan sprite karakter/potret placeholder sederhana buatan sendiri. Fokus Fase 2 adalah mekanik; aset final diganti di Fase 3 atau nanti. Setiap aset pihak ketiga dicatat sumber + lisensinya di `CREDITS.md`. *(2.1–2.2: tile dan sprite pemain placeholder digambar lewat kode di `src/game/placeholderTiles.ts` dan `placeholderSprites.ts` — belum ada aset pihak ketiga.)*

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
- **Query wajib diakhiri titik koma `;`** — kebiasaan penting sejak hari pertama. Dicek setelah hasilnya benar, dengan pesan ramah ("hasilnya sudah benar, tinggal akhiri dengan `;`"). Mode blok selalu menyediakan blok `;`; template isi-kosong sudah diakhiri `;`.

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
- **Urutan level terjaga**: level yang sudah selesai dan satu level berikutnya bisa dibuka dari daftar level; sisanya terkunci. Progres (level terakhir + jumlah hint yang dipakai per level) disimpan di browser.
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
| Dunia game | **Phaser 3** + tilemap (diputuskan di perencanaan Fase 2) | Dunia top-down, karakter berjalan, NPC, animasi |
| Konsol SQL | **UI HTML di atas canvas game** (editor kode di DOM) | Editor, autocomplete, dan tabel hasil jauh lebih mudah dibuat dengan HTML daripada di dalam canvas |
| Arsitektur | **Inti SQL terpisah dari dunia game** | Inti SQL (database, validasi, data level) bisa dibangun dan dites lebih dulu, lalu dipanggil oleh dunia game |
| Backend | **Tanpa backend** untuk MVP | Gratis di-hosting, cepat jadi; progres disimpan lokal di browser |
| Engine SQL | **PostgreSQL di browser via PGlite** | Dialek paling dekat dengan dunia kerja BI (Postgres, Redshift, BigQuery, Snowflake) |
| Kompetisi | **Rush Hour + skor terbaik pribadi** | Leaderboard antar pemain menyusul setelah ada backend |
| Bahasa game | **English (utama) + pilihan Bahasa Indonesia** untuk dialog, kartu materi, task, hint, umpan balik, dan UI. **Selalu English:** SQL, nama tabel/kolom, isi data, pesan error PostgreSQL | English untuk pasar global dan sama dengan praktik kerja; Indonesia agar pemula lokal mudah masuk. Isi data tetap English karena query pemain bergantung padanya (`WHERE category = 'coffee'`). Terjemahan di file terpisah (`locales/id/`) dengan fallback ke English. *Uji coba di Fase 1 — dihentikan bila biaya perawatannya terlalu besar.* |
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

### Struktur kode (tambahan Fase 2)
- `src/sql-core/stations.ts` — daftar stasiun dan tabel yang boleh diakses tiap stasiun (data murni, tanpa engine). Level mendapat field `station`.
- `src/game/` — Phaser: scene ruangan, pemain, NPC, stasiun, pathfinding. **Tidak boleh** meng-import React.
- `src/game/bridge.ts` — penghubung kecil (event) antara Phaser dan React: "bicara dengan NPC", "buka stasiun", "overlay ditutup". Saat overlay terbuka, input keyboard Phaser dimatikan agar mengetik SQL tidak menggerakkan karakter.
- `src/app/` — React membungkus kanvas game dan menampilkan overlay (dialog, konsol, daftar level).

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

**Terjemahan:** teks Indonesia per chapter ada di `src/sql-core/levels/locales/id/` (hanya teks; SQL, blok, dan jawaban tidak diterjemahkan). Umpan balik checker dikembalikan sebagai kode terstruktur lalu diubah jadi kalimat EN/ID oleh `formatFeedback`. Tes otomatis memastikan setiap level punya terjemahan dengan struktur yang sama (jumlah baris dialog, ada/tidaknya kartu materi).

## 11. Data game

- Database kafe dibuat **realistis**: `menu_items` (kategori, harga & cost), `sales` per transaksi (dengan tanggal & jam), `customers`, `employees`/shift, `inventory`, `suppliers`, kanal penjualan (dine-in, takeaway, delivery app).
- Semua nama tabel dan kolom dalam English, gaya `snake_case`.
- Sengaja diberi **data kotor** (nilai kosong, duplikat, salah ketik) di level tertentu — karena itu kenyataan di dunia kerja.
- Data Analysis Case dirancang dengan pola tersembunyi yang bisa ditemukan lewat query.

## 12. Roadmap

Dibangun bertahap — setiap fase menghasilkan sesuatu yang bisa dimainkan.

**Status (13 Nov 2026):** ✅ **Fase 1 selesai.** Chapter 0–1 (10 level) bisa dimainkan dalam EN/ID, dengan pengecek jawaban, hint, progres tersimpan, dan 110 tes otomatis. Pemilik project sudah uji main dan menyetujui rasa belajarnya. 🚧 **Fase 2 sedang berjalan** — rencana dan keputusan ada di "Rencana Fase 2" di bawah. Selesai: 2.1, 2.2, 2.3.

Catatan dari Fase 1 untuk fase berikutnya:
- Ukuran unduhan pertama PGlite besar (±3,5 MB wasm terkompresi + 6 MB data) — perlu layar loading yang jelas dan dicek saat memilih hosting.
- PGlite belum di Web Worker, jadi query yang macet tidak bisa dihentikan (lihat §10).
- Di layar HP, daftar tabel muncul di atas area input; tata letak konsol ditata ulang saat menjadi overlay di dunia game (Fase 2).

| Fase | Isi | Selesai jika… |
|---|---|---|
| **1. Inti SQL** | PGlite + data kafe, pengecek jawaban, format data level, konsol SQL (input blok → isi kosong → bebas), Chapter 0–1, pilihan bahasa EN/ID | Chapter 0–1 bisa dimainkan lengkap di halaman sederhana, dan rasa belajarnya sudah enak |
| **2. Dunia pertama** | Game engine, satu ruangan (area depan + front counter), karakter berjalan, Grandma sebagai NPC, dialog, konsol terbuka dari stasiun | Pemain bisa jalan → bicara dengan Grandma → ke menu board → menyelesaikan level Chapter 0–1 di dalam dunia game |
| **3. Kafe tumbuh** | Kitchen, storeroom, back office; Chapter 2–5; koin, upgrade, bintang, streak, Rush Hour, Analysis Case | MVP lengkap Chapter 0–5 |
| **Nanti** | Skill Check, materi lanjutan, leaderboard (butuh backend), audio, polesan | — |

### Rencana Fase 2 — Dunia pertama

Keputusan: Phaser 3 · pixel art 16 px (karakter 16×32, potret 64×64) · aset placeholder CC0 · keyboard + klik/tap · stasiun baru **Menu board** di area depan untuk `menu_items` (semua level Chapter 0–1).

Satu ruangan: area depan kafe (pintu, meja pelanggan, menu board) + front counter (cash register). Cash register sudah bisa dibuka untuk melihat `sales`/`customers`, tapi belum ada level di sana sampai Chapter 3.

Iterasi kecil, masing-masing: kerjakan → cek di browser → commit & push.

| # | Iterasi | Selesai jika… |
|---|---|---|
| 2.1 ✅ | Pasang Phaser; kanvas game di halaman React; ruangan placeholder dari tilemap 16 px (zoom 3×) | Ruangan kafe tampil tajam di browser; halaman Fase 1 masih bisa dibuka di `?classic` selama transisi |
| 2.2 ✅ | Pemain 16×32 berjalan dengan WASD/panah; tabrakan dengan dinding & furnitur; kamera mengikuti | Bisa berkeliling ruangan tanpa menembus objek |
| 2.3 ✅ | Klik/tap untuk berjalan (pathfinding di grid) | Klik/tap lantai → pemain berjalan memutari halangan |
| 2.4 | Grandma sebagai NPC + sistem interaksi (penanda "E" saat dekat) + kotak dialog React dengan potret 64×64 | Bicara dengan Grandma menampilkan dialog level aktif (EN/ID) |
| 2.5 | `stations.ts` + field `station` di level; konsol sebagai overlay yang dibuka dari stasiun; daftar tabel difilter per stasiun; keyboard Phaser dimatikan saat overlay terbuka | Menu board membuka konsol berisi `menu_items`; tes memastikan setiap jawaban level hanya memakai tabel dari stasiunnya |
| 2.6 | Alur level di dunia: penanda "!" di atas Grandma → dialog + kartu materi → penanda di stasiun → konsol → benar → kembali ke Grandma untuk ucapan sukses → level berikutnya. Hint, progres, dan daftar level (sebagai menu "Journal") tetap jalan | Chapter 0–1 bisa diselesaikan seluruhnya di dalam dunia game |
| 2.7 | Layar loading (PGlite besar), tata letak overlay di HP, tombol bahasa & menu di HUD | Bisa dimainkan nyaman di desktop dan HP |
| 2.8 | Uji main pemilik project, perbaikan, README, status | Pemilik project menyetujui → Fase 2 selesai |

Di luar Fase 2: kitchen/storeroom/back office, koin & upgrade, NPC pelanggan berjalan, aset final, audio, PGlite di Web Worker.

## 13. Pertanyaan terbuka

- [x] Framework UI konsol — **React** (diputuskan di perencanaan Fase 1)
- [x] Game engine final — **Phaser 3** (perencanaan Fase 2)
- [x] Gaya visual — **pixel art 16 px** (karakter 16×32, potret 64×64); sumber aset Fase 2 — **placeholder CC0 + buatan sendiri** (lihat §3)
- [x] Kontrol — **keyboard + klik/tap** untuk berjalan (lihat §3)
- [ ] Aset final: buat sendiri atau beli asset pack berlisensi komersial — diputuskan di Fase 3
- [x] Mata uang — **$ (USD)**
- [ ] Nuansa setting kota (generik/internasional, atau ada sentuhan lokal tertentu)
- [ ] Isi detail tiap level (dialog, data, jawaban) per chapter — Chapter 0 (4 level) dan Chapter 1 (6 level) sudah ditulis, lengkap dengan terjemahan Indonesia
- [x] **Stasiun untuk Chapter 0–1** — stasiun baru **Menu board** di area depan membaca `menu_items` (cocok dengan cerita "Cleaning Up the Menu"); Kitchen tetap untuk `recipes` di Fase 3
- [ ] Bentuk Skill Check (berapa soal, bagaimana menentukan chapter awal)
- [ ] Hosting (mis. GitHub Pages / Vercel / Netlify)
