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

### Skill Check (diputuskan di perencanaan Fase 3)
- **Dibuat begitu Chapter 3–4 ada** (iterasi 3.9), tidak menunggu MVP selesai.
- **Adaptif per chapter:** 2 soal ketik bebas per chapter, mulai dari Chapter 0. Berhenti di chapter pertama yang gagal (salah satu dari 2 soal tidak terjawab) → pemain mulai dari chapter itu.
- Ditawarkan Grandma di hari pertama ("Worked with data before?") dan bisa diulang dari Journal. Pemula total cukup menjawab "No" dan mulai di Chapter 0.
- Chapter yang dilewati **terbuka tapi tanpa bintang**, sehingga bisa dimainkan ulang kapan saja; Mini Case chapter yang dilewati tetap bisa dimainkan.
- Soal Skill Check terpisah dari soal level (pemain tidak sekadar mengulang jawaban level), dinilai dengan pengecek jawaban yang sama.

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
| 🧾 Front counter | Cash register | `sales`, `customers` (+ `menu_items` untuk JOIN — sistem kasir mengenal menu) |
| 🍳 Kitchen | Recipe book | `recipes` (+ `menu_items` untuk JOIN) |
| 📦 Storeroom | Stock ledger | `inventory`, `suppliers` |
| 🗂 Back office | Grandma's computer | Semua tabel (Analysis Case) |

- **Ruangan terbuka bertahap** mengikuti chapter — membuka ruangan baru adalah bagian dari sistem progres.
- **Satu peta terhubung** (keputusan Fase 3): semua ruangan ada di satu tilemap, dipisah pintu yang terkunci sampai chapternya terbuka. Tanpa pergantian scene, jadi kamera, pathfinding, dan panah penunjuk tetap bekerja lintas ruangan.
- **Query ke tabel di luar stasiun diblokir** (keputusan Fase 3) dengan pesan ramah, mis. "This station can't see `sales` — it's at the Cash register." Memperkuat pelajaran "data tersebar di banyak sistem". Back office melihat semua tabel. Cara teknis di §10.
- **Navigasi antar-ruangan** (keputusan Fase 3): **tanpa minimap di layar**. Journal mendapat tab **Café map** (denah ruangan, ruangan terkunci, posisi pemain, dan letak "!" tugas aktif). Bila target ada di ruangan lain, panah penunjuk menunjuk ke pintu menuju ruangan itu; pintu diberi label nama ruangan.
- Konsol tampil sebagai **panel overlay** di atas dunia game (dunia tetap terlihat di belakang).
- **Kontrol:** keyboard (WASD/panah untuk berjalan, E/Spasi untuk bicara/membuka stasiun) **dan** klik/tap tujuan untuk berjalan (pathfinding di grid), sehingga bisa dimainkan di desktop maupun HP. Klik/tap pada NPC atau stasiun = berjalan ke sana lalu berinteraksi. Klik pada benda/dinding = berjalan ke tile terdekat yang bisa dicapai. Bisa bicara bila pemain berdiri di tile yang menyentuh tile NPC (termasuk diagonal); gelembung "…" muncul di atas NPC sebagai tanda.
- **Dialog:** kotak di bawah layar dengan potret 64×64 (ditampilkan 96 px), satu kalimat per langkah; lanjut dengan klik, Spasi, Enter, atau E; Esc menutup. Selama dialog terbuka, dunia berhenti menerima input. NPC yang punya permintaan di level aktif mengucapkan dialog level itu; NPC lain hanya mengobrol singkat. Jalur boleh diagonal tapi tidak memotong sudut; menekan tombol arah membatalkan jalur klik.

### Gaya visual & aset
- **Pixel art cozy** ala game simulasi/bertani top-down — hanya *konvensi ukurannya* yang diikuti; gambar, karakter, dan warna tetap **orisinal**.

| Jenis aset | Ukuran (px) | Keterangan |
|---|---|---|
| Tile peta (lantai, dinding, rumput, jalan) | 16×16 | Satu kotak grid |
| Item & ikon kecil | 16×16 | Ikon menu, cangkir, dll. |
| Karakter (pemain & NPC) | 16×32 | Tinggi dua tile |
| Potret dialog | 64×64 | Wajah tokoh di kotak dialog |
| Objek tinggi & furnitur | 16×32 atau 32×32 | Counter, mesin kopi, rak, papan menu |

- Ditampilkan dengan **zoom bulat** (mis. 3×) dan `pixelArt: true` agar piksel tetap tajam. Zoom otomatis 2×–4×: bila seluruh ruangan muat pada ≥2× (desktop), ruangan tampil utuh; bila tidak (HP), zoom dipilih agar layar terisi (biasanya 3×) dan kamera mengikuti pemain.
- **Zoom manual** (masukan uji main Fase 2): tombol − / + di pojok kanan bawah dunia game dan scroll mouse, 1×–4×, diingat di browser. Di HP, 1× memperlihatkan seluruh ruangan.
- **Panah penunjuk:** bila target "!" berada di luar layar, panah emas di tepi layar menunjuk ke arahnya. *Minimap tidak dibuat* — diganti tab Café map di Journal (keputusan Fase 3, lihat di atas).
- Hanya **kaki** karakter yang bertabrakan (kepala boleh menutupi benda di belakangnya); benda yang lebih bawah di layar digambar di depan.
- **Sumber aset Fase 2: placeholder.** Tile dari pack **CC0** (kandidat: Kenney, 16×16) dan sprite karakter/potret placeholder sederhana buatan sendiri. Fokus Fase 2 adalah mekanik; aset final diganti di Fase 3 atau nanti. Setiap aset pihak ketiga dicatat sumber + lisensinya di `CREDITS.md`. *(2.1–2.4: tile, sprite pemain & Grandma, dan potret Grandma placeholder digambar lewat kode di `src/game/placeholderTiles.ts`, `placeholderSprites.ts`, dan `placeholderPortraits.ts` — belum ada aset pihak ketiga.)* *(3.1: `placeholderTiles.ts` diganti `src/game/art/tiles.ts`; sprite & potret Grandma diganti aset final.)*

#### Arah visual final (diputuskan di awal Fase 3)
- **Suasana: hangat musim gugur** — kayu, krem, oranye bata, hijau zaitun, cahaya lampu hangat. Cocok dengan cerita lembah di musim gugur dan kasus "October sales dropped".
- **Satu palet tetap: 32 warna** untuk semua aset — tile, karakter, potret, dan aksen UI. Palet disusun sendiri di iterasi 3.1 (`src/game/art/palette.ts`, tanpa lisensi pihak ketiga); aset baru wajib memakai palet ini (dicek tes otomatis).
- **Sumber aset: tile & furnitur dari pack CC0 16 px** (aman di repo GitHub yang publik), diwarnai ulang ke palet bila perlu; **karakter dan potret dibuat sendiri** agar tokoh SQL Valley khas.
  - Pack yang dipakai: **Kenney "Roguelike Indoors"** (CC0) — meja, kursi, tanaman pot, counter, lukisan. Pack ini hanya berisi furnitur, jadi lantai, dinding, jendela, rak, mesin kopi, cash register, menu board, dan keset dibuat sendiri. Sumber dicatat di `CREDITS.md`.
  - **Format aset: grid teks di kode TypeScript** (satu karakter = satu piksel, huruf = warna palet), bukan file PNG. Alasannya: bisa dibaca dan di-diff di git, warnanya terkunci ke palet (dicek tes), dan cara memuatnya sama dengan placeholder Fase 2. Tile Kenney diubah ke grid ini dengan warna dipetakan ke palet; potret 64×64 digambar dari bentuk dasar (elips, persegi) dengan outline otomatis.
- **Diuji dulu lewat contoh:** satu ruangan (area depan) + satu karakter (Grandma, sprite + potret) dalam gaya final (iterasi 3.1). Bila pemilik project menilai hasilnya kurang, cadangannya **beli asset pack berlisensi komersial** — dengan catatan file aslinya tidak boleh di-commit ke repo publik.
- **Diganti bertahap**, tidak menunggu semua fitur selesai: ruang depan + Grandma di 3.1; Barista dan Regular saat level mereka disentuh; ruangan baru (kitchen, storeroom, back office) langsung dibuat dalam gaya final; sisa placeholder dibersihkan di iterasi terakhir Fase 3.

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

### Alur quest di dunia game (Fase 2)
Setiap level adalah satu permintaan dengan tahap yang disimpan di progres (`quest` di `progress.ts`):

1. **talk** — penanda "!" di atas pemberi tugas. Bicara → dialog → kartu materi (bila ada) → tahap berikutnya.
2. **solve** — "!" pindah ke stasiun. Konsol hanya terbuka di stasiun itu; pemberi tugas hanya mengingatkan.
3. **report** — setelah jawaban benar (progres tersimpan), "!" kembali ke pemberi tugas, yang mengucapkan kalimat sukses.
4. Lanjut ke level berikutnya (tahap **talk**); setelah level terakhir tahapnya **done**.

- Bar di bawah header selalu menunjukkan langkah berikutnya (mis. "Talk to Grandma", atau tugas + stasiunnya), dan status "Loading records…" selama database PGlite dimuat di belakang layar. Dunia sudah bisa dijelajahi sebelum database siap; konsol menampilkan bilah loading, atau pesan galat + tombol "Try again" bila gagal.
- Header berisi 📖 Journal dan pilihan bahasa (ringkas agar muat di HP). Tombol header tidak menahan fokus, jadi Spasi/E tetap dipakai untuk bicara di dunia.
- Chapter baru dibuka dengan kartu chapter. **Journal** (menu di header) menampilkan daftar level; level yang sudah selesai bisa dimainkan ulang dari tahap *talk*. "Start over" ada di Journal.

## 5. Jenis level

| Jenis (in-game) | Deskripsi | Mulai dari |
|---|---|---|
| **Request** | Satu pertanyaan, satu hasil yang benar | Chapter 0 |
| **Report** | Hasil dengan format kolom tertentu (top-N, KPI) | Chapter 2 |
| **So what?** 💭 | Pertanyaan interpretasi singkat setelah query benar di sebagian level | Chapter 0 |
| **Mini Case** 🔍 | Investigasi kecil di akhir tiap chapter (2–4 query, pertanyaan kesimpulan, query bukti) | Chapter 1 |
| **Analysis Case** 🎯 | Investigasi terbuka besar (lihat di bawah) | Chapter 5 |
| **Rush Hour** ⏱ | Mode tantangan berwaktu: permintaan datang bertubi-tubi | Terbuka setelah Chapter 2 |

### Berpikir seperti analis sejak awal (keputusan Fase 3)
Masukan akhir Fase 2: nilai jual game ("berpikir seperti analis BI") baru terasa di Chapter 5. Karena itu rasa analis dimunculkan sejak awal lewat dua lapis:

**💭 So what?** — setelah query benar di ±1–2 level per chapter, tokoh bertanya "jadi artinya apa?": satu pertanyaan pilihan ganda (3 pilihan) tentang makna hasil query. Contoh setelah melihat daftar harga: *"If profits were low, which items would you look at first?"*
- Tidak mempengaruhi bintang dan tidak menghalangi progres; jawaban salah dijelaskan singkat, jawaban benar memberi bonus koin kecil.
- Di data level: field opsional `soWhat` (`question`, `choices`, `answer`, `explanation`), ikut diterjemahkan.

**🔍 Mini Case** — level terakhir tiap chapter, mulai Chapter 1. Versi kecil Analysis Case dengan **mesin yang sama**, sehingga Chapter 5 tinggal memakai ulang dan memperbesarnya:
1. Tokoh menyampaikan masalah bisnis kecil (*brief*).
2. Pemain menjalankan beberapa query bebas di stasiun chapter itu dan **menyematkan (📌)** hasil query ke **catatan investigasi**.
3. Pemain menjawab 2–3 **pertanyaan kesimpulan** (pilihan ganda atau isian nama/angka). Setiap jawaban harus didukung satu query 📌; query bukti dinilai cukup bila hasilnya memuat data kunci jawaban (mis. baris "Hot Chocolate" dengan `price` kosong).
4. Bintang: ⭐ kasus selesai · ⭐⭐ tanpa hint · ⭐⭐⭐ tanpa kesimpulan salah.
- Mini Case selalu memakai **editor ketik bebas**. Di Chapter 1 (pemain belum belajar ketik bebas) catatan investigasi menyediakan **query awal yang bisa diubah** sebagai jembatan menuju Chapter 2.

| Chapter | Mini Case (draf) | Tokoh · stasiun | Pertanyaan kesimpulan (contoh) |
|---|---|---|---|
| 1 | **The Menu Audit** — menu baru dicetak besok; apa yang belum siap? | Grandma · Menu board | Berapa item yang datanya belum lengkap? Item mana yang tidak bisa dijual karena tanpa harga? Apa yang harus diperbaiki dulu? |
| 2 | **What Should We Promote?** — pilih satu item untuk dipromosikan | Barista · Menu board | Item mana dengan margin tertinggi? Apakah item termahal juga paling untung? |
| 3 | **The Quiet Day** — ada hari yang sepi? | Grandma · Cash register | Hari apa revenue terendah? Sepi karena order sedikit atau karena nilai order kecil (AOV)? |
| 4 | **Where Did the Regulars Go?** — pelanggan tetap menghilang | Regular · Cash register | Berapa pelanggan yang tidak kembali? Apa yang biasa mereka beli? |
| 5 | **The Analysis Case** — "October sales dropped 18%. What happened?" | Grandma · Back office | (lihat di bawah) |

Data penjualan (Fase 3) dirancang agar setiap Mini Case punya pola yang bisa ditemukan, tanpa membocorkan cerita Analysis Case.

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

Mulai Fase 3: Chapter 1–4 masing-masing ditutup dengan **Mini Case** 🔍, dan ±1–2 level per chapter (mulai Chapter 0) punya pertanyaan **So what?** 💭 (lihat §5).

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
- `src/app/` — halaman sederhana: daftar level, alur level, progres (localStorage). *(Halaman ini dihapus setelah Fase 2 — lihat §12.)*

### Struktur kode (tambahan Fase 3)
- `src/game/art/` — aset final: `palette.ts` (32 warna + `paintGrid`), `tiles.ts` (tileset kafe), `grandma.ts` (sprite 16×32 + potret 64×64). Karakter yang belum punya aset final tetap memakai `placeholderSprites.ts` / `placeholderPortraits.ts` (dipilih otomatis di `characters.ts` dan `characterPortrait`).

### Struktur kode (tambahan Fase 2)
- `src/sql-core/stations.ts` — daftar stasiun dan tabel yang boleh diakses tiap stasiun (data murni, tanpa engine). Level mendapat field `station`; tes memastikan jawaban resmi tiap level hanya memakai tabel stasiunnya.
- Konsol di stasiun hanya **menampilkan** tabel milik stasiun itu. *(Fase 3: query ke tabel lain juga diblokir — lihat di bawah.)*
- Konsol terbuka hanya di stasiun tempat tugas aktif dikerjakan; stasiun lain menampilkan pesan singkat. Konsol tetap tersimpan selama level yang sama, jadi query yang sedang disusun tidak hilang saat konsol ditutup (Esc atau ✕).
- `src/game/` — Phaser: scene ruangan, pemain, NPC, stasiun, pathfinding. **Tidak boleh** meng-import React.
- `src/game/bridge.ts` — penghubung kecil (event) antara Phaser dan React: "bicara dengan NPC", "buka stasiun", "overlay ditutup". Saat overlay terbuka, input keyboard Phaser dimatikan agar mengetik SQL tidak menggerakkan karakter.
- `src/app/` — React membungkus kanvas game dan menampilkan overlay (dialog, konsol, daftar level).

### Pengecek jawaban
- Query pemain dan query jawaban resmi dijalankan di database yang sama; **hasilnya** yang dibandingkan.
- Setiap query pemain berjalan di dalam transaksi **READ ONLY** yang selalu di-*rollback* (data tidak bisa rusak); perintah transaksi (`BEGIN`/`COMMIT`/…) ditolak.
- Batas waktu query (`statement_timeout`) **tidak berfungsi** di PGlite karena berjalan di satu thread. PGlite dipindah ke Web Worker di Fase 3 (bersama data penjualan yang lebih besar, iterasi 3.5) agar query yang macet bisa dihentikan.
- **Blokir tabel per stasiun (Fase 3):** cara utama memakai izin asli PostgreSQL — satu *role* per stasiun dengan `GRANT SELECT` hanya pada tabelnya, lalu `SET LOCAL ROLE` di dalam transaksi READ ONLY. Galat `permission denied for table …` diubah menjadi pesan ramah yang menyebut stasiun pemilik tabel. Bila PGlite ternyata tidak mendukung role dengan baik, cadangannya membaca nama tabel dari `EXPLAIN (FORMAT JSON)` sebelum query dijalankan (bukan scan teks seperti `tablesInQuery`, yang hanya untuk tes). Logikanya tinggal di `src/sql-core/` (stasiun tetap data murni).

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
- **Rancangan data penjualan (difinalkan di iterasi 3.5):** `sales` satu baris per item terjual (`sale_id`, `order_id`, `sold_at`, `item_id`, `quantity`, `unit_price`, `channel`, `customer_id` boleh kosong untuk pelanggan tanpa akun), agar KPI Chapter 3 tidak butuh JOIN (AOV = revenue ÷ `COUNT(DISTINCT order_id)`). Periode ±Agustus–Oktober. Dibuat oleh **generator dengan seed tetap** di TypeScript (hasil selalu sama, jadi jawaban level stabil dan bisa dites), dengan pola sengaja untuk tiap Mini Case dan Analysis Case.

## 12. Roadmap

Dibangun bertahap — setiap fase menghasilkan sesuatu yang bisa dimainkan.

**Status (13 Nov 2026):** ✅ **Fase 1 selesai.** Chapter 0–1 (10 level) bisa dimainkan dalam EN/ID, dengan pengecek jawaban, hint, progres tersimpan, dan 110 tes otomatis. Pemilik project sudah uji main dan menyetujui rasa belajarnya. ✅ **Fase 2 selesai.** Chapter 0–1 dimainkan di dalam dunia game (ruang depan kafe, Phaser): berjalan dengan keyboard atau klik/tap, menerima permintaan dari Grandma, Barista, dan Regular, menyelesaikannya di konsol Menu board, lalu melapor. Ada Journal, zoom manual, dan panah penunjuk; 162 tes otomatis. Pemilik project sudah uji main (desktop + HP) dan menyetujuinya. 🚧 **Fase 3 dimulai** — keputusan perencanaan dan rencana iterasinya ada di "Rencana Fase 3" di bawah.

Catatan dari Fase 1 untuk fase berikutnya:
- Ukuran unduhan pertama PGlite besar (±3,5 MB wasm terkompresi + 6 MB data) — perlu layar loading yang jelas dan dicek saat memilih hosting.
- PGlite belum di Web Worker, jadi query yang macet tidak bisa dihentikan (lihat §10).
- ~~Di layar HP, daftar tabel muncul di atas area input~~ — konsol sudah menjadi overlay yang memenuhi layar HP (Fase 2).

Catatan dari Fase 2 untuk fase berikutnya:
- Semua aset masih placeholder yang digambar lewat kode (`src/game/placeholder*.ts`); keputusan aset final ada di §13.
- Cash register sudah ada di dunia tapi belum dibuka; terbuka otomatis saat tabel `sales`/`customers` dibuat. *(Diputuskan di Fase 3: query ke tabel di luar stasiun diblokir — §3, §10.)*
- Minimap belum dibuat (cukup zoom 1× + panah penunjuk untuk satu ruangan). *(Diputuskan di Fase 3: tanpa minimap, diganti tab Café map di Journal — §3.)*
- **Mode klasik (`?classic`) dihapus** (keputusan pemilik project setelah Fase 2): mempertahankannya berarti setiap fitur Fase 3 (bintang, koin, Analysis Case, Rush Hour, tabel per stasiun) harus dibuat dua kali. Jalan pintas pengembangan `?level=ch1-3` kini membuka permintaan level itu langsung di dunia game.
- Belum teruji otomatis: mengubah ukuran jendela/memutar HP saat game berjalan dan tampilan galat database (sudah dicoba manual oleh pemilik project untuk HP).
- Teks bar tugas English memakai nama tokoh apa adanya ("Talk to Regular") — bisa dirapikan saat menulis teks Chapter 2+.

| Fase | Isi | Selesai jika… |
|---|---|---|
| **1. Inti SQL** | PGlite + data kafe, pengecek jawaban, format data level, konsol SQL (input blok → isi kosong → bebas), Chapter 0–1, pilihan bahasa EN/ID | Chapter 0–1 bisa dimainkan lengkap di halaman sederhana, dan rasa belajarnya sudah enak |
| **2. Dunia pertama** | Game engine, satu ruangan (area depan + front counter), karakter berjalan, Grandma sebagai NPC, dialog, konsol terbuka dari stasiun | Pemain bisa jalan → bicara dengan Grandma → ke menu board → menyelesaikan level Chapter 0–1 di dalam dunia game |
| **3. Kafe tumbuh** | Arah visual final; Mini Case & So what?; kitchen, storeroom, back office; Chapter 2–5; koin, upgrade, bintang, streak, Skill Check, Rush Hour, Analysis Case | MVP lengkap Chapter 0–5 |
| **Nanti** | Materi lanjutan, leaderboard (butuh backend), audio, polesan | — |

### Rencana Fase 2 — Dunia pertama

Keputusan: Phaser 3 · pixel art 16 px (karakter 16×32, potret 64×64) · aset placeholder CC0 · keyboard + klik/tap · stasiun baru **Menu board** di area depan untuk `menu_items` (semua level Chapter 0–1) · NPC **Barista** (di belakang counter) dan **Regular** (dekat meja jendela) ikut ditambahkan di 2.6 karena tiga level Chapter 1 adalah permintaan mereka.

Satu ruangan: area depan kafe (pintu, meja pelanggan, menu board) + front counter (cash register). Cash register sudah ada di dunia, tapi **belum dibuka**: tabel `sales`/`customers` baru dibuat di Fase 3, jadi untuk sementara stasiun ini hanya menampilkan pesan singkat. Stasiun otomatis terbuka begitu tabelnya ada di database.

Iterasi kecil, masing-masing: kerjakan → cek di browser → commit & push.

| # | Iterasi | Selesai jika… |
|---|---|---|
| 2.1 ✅ | Pasang Phaser; kanvas game di halaman React; ruangan placeholder dari tilemap 16 px (zoom 3×) | Ruangan kafe tampil tajam di browser; halaman Fase 1 masih bisa dibuka di `?classic` selama transisi |
| 2.2 ✅ | Pemain 16×32 berjalan dengan WASD/panah; tabrakan dengan dinding & furnitur; kamera mengikuti | Bisa berkeliling ruangan tanpa menembus objek |
| 2.3 ✅ | Klik/tap untuk berjalan (pathfinding di grid) | Klik/tap lantai → pemain berjalan memutari halangan |
| 2.4 ✅ | Grandma sebagai NPC + sistem interaksi (gelembung "…" saat dekat; E/Spasi/klik untuk bicara) + kotak dialog React dengan potret 64×64 | Bicara dengan Grandma menampilkan dialog level aktif (EN/ID) |
| 2.5 ✅ | `stations.ts` + field `station` di level; konsol sebagai overlay yang dibuka dari stasiun; daftar tabel difilter per stasiun; keyboard Phaser dimatikan saat overlay terbuka | Menu board membuka konsol berisi `menu_items`; tes memastikan setiap jawaban level hanya memakai tabel dari stasiunnya |
| 2.6 ✅ | Alur level di dunia: penanda "!" di atas pemberi tugas (Grandma, Barista, atau Regular) → dialog + kartu materi → penanda di stasiun → konsol → benar → kembali ke Grandma untuk ucapan sukses → level berikutnya. Hint, progres, dan daftar level (sebagai menu "Journal") tetap jalan | Chapter 0–1 bisa diselesaikan seluruhnya di dalam dunia game |
| 2.7 ✅ | Layar loading (PGlite besar), tata letak overlay di HP, tombol bahasa & menu di HUD | Bisa dimainkan nyaman di desktop dan HP |
| 2.8 ✅ | Uji main pemilik project, perbaikan (zoom manual + panah penunjuk), README, status | Pemilik project menyetujui → Fase 2 selesai |

Di luar Fase 2: kitchen/storeroom/back office, koin & upgrade, NPC pelanggan berjalan, aset final, audio, PGlite di Web Worker.

### Rencana Fase 3 — Kafe tumbuh

Keputusan (perencanaan Fase 3, 13 Nov 2026), berdasarkan masukan pemilik project di akhir Fase 2:

| Topik | Keputusan | Detail |
|---|---|---|
| Nilai jual muncul lebih awal | **Mini Case** 🔍 di akhir Chapter 1–4 + pertanyaan **So what?** 💭 di sebagian level mulai Chapter 0 | §5. Mesin Mini Case = mesin Analysis Case versi kecil, dibangun lebih dulu (3.2) |
| Arah visual | **Hangat musim gugur**, satu palet tetap; **tile CC0 + karakter/potret buatan sendiri**; dicek lewat contoh 1 ruangan + 1 karakter, lalu diganti bertahap | §3. Cadangan: beli pack (file asli tidak masuk repo publik) |
| Skill Check | **Adaptif per chapter** (2 soal/chapter, berhenti di chapter pertama yang gagal), dibuat segera setelah Chapter 4 ada | §2 |
| Tabel di luar stasiun | **Diblokir** dengan pesan ramah, memakai role PostgreSQL per stasiun | §3, §10 |
| Minimap | **Tidak ada**; tab **Café map** di Journal + panah penunjuk ke pintu | §3 |
| Struktur ruangan | **Satu peta terhubung**, pintu terkunci per chapter | §3 |
| Cash register | Juga melihat `menu_items` (untuk JOIN Chapter 4) | §3 |

Setiap iterasi bisa dimainkan sendiri: kerjakan → cek di browser → commit & push. Urutannya mendahulukan nilai jual (3.2) dan arah visual (3.1), lalu menambah chapter satu per satu.

| # | Iterasi | Selesai jika… |
|---|---|---|
| 3.1 🚧 | **Arah visual:** file palet musim gugur, pilih pack tile CC0, ruang depan + Grandma (sprite & potret) dalam gaya final, `CREDITS.md` | Pemilik project melihat ruang depan + Grandma baru di browser dan menyetujui arahnya (atau memilih cadangan beli pack) |
| 3.2 | **Mesin Mini Case + So what?:** catatan investigasi, 📌 sematkan hasil query, pertanyaan kesimpulan dengan cek bukti, field `soWhat`; Mini Case Ch1 **The Menu Audit**; So what? di 1–2 level Ch0–1 (EN/ID) | Setelah level terakhir Ch1, pemain menyelesaikan The Menu Audit di Menu board dengan bukti 📌; So what? muncul di Ch0–1 |
| 3.3 | **Bintang & koin:** catat hint + jawaban salah per level/kasus, layar hasil (⭐ + koin), bintang di Journal, penghitung koin di HUD; progres lama tetap terbaca | Menyelesaikan level/kasus menampilkan bintang & koin, tersimpan, dan terlihat di Journal |
| 3.4 | **Chapter 2 First Reports** (ketik bebas: `ORDER BY`, `LIMIT`, `DISTINCT`, alias, kolom hitungan) + Mini Case **What Should We Promote?**; Barista dalam gaya final | Chapter 2 bisa dimainkan lengkap di Menu board, EN/ID |
| 3.5 | **Data penjualan & stasiun kedua:** generator data `sales`/`customers` dengan seed tetap, Cash register terbuka, blokir tabel per stasiun (role PostgreSQL), PGlite di Web Worker + tombol hentikan query | Cash register membuka konsol berisi `sales`, `customers`, `menu_items`; query ke tabel lain ditolak dengan pesan ramah; query macet bisa dihentikan |
| 3.6 | **Chapter 3 Numbers Talk** (`COUNT`/`SUM`/`AVG`/`MIN`/`MAX`, `GROUP BY`, `HAVING`, dasar tanggal) + Mini Case **The Quiet Day** | Chapter 3 bisa dimainkan lengkap di Cash register, EN/ID |
| 3.7 | **Kafe berkembang:** peta multi-ruangan dengan pintu terkunci per chapter, **Kitchen** + tabel `recipes` + Recipe book (gaya final), tab **Café map** di Journal, panah penunjuk ke pintu | Kitchen terbuka setelah Ch3; Café map menunjukkan ruangan dan target tugas |
| 3.8 | **Chapter 4 Connecting the Dots** (`INNER`/`LEFT JOIN`, JOIN + agregasi) + Mini Case **Where Did the Regulars Go?**; Regular dalam gaya final | Chapter 4 bisa dimainkan lengkap di Kitchen & Cash register, EN/ID |
| 3.9 | **Skill Check** adaptif (soal Ch0–4) dari Grandma di hari pertama & dari Journal | Pemain yang sudah bisa SQL dasar bisa langsung mulai di chapter yang sesuai |
| 3.10 | **Storeroom + Back office** (`inventory`, `suppliers`, Supplier NPC, Grandma's computer) + **Chapter 5 Analysis Case** "October sales dropped 18%" | Analysis Case bisa diselesaikan lengkap dengan bukti 📌 di Back office |
| 3.11 | **Kafe yang tumbuh:** upgrade dengan koin (kursi, dekorasi, papan menu, NPC pelanggan berjalan), daily streak 🔥, badge | Koin bisa dibelanjakan dan kafe berubah terlihat di dunia |
| 3.12 | **Rush Hour** ⏱ (terbuka setelah Chapter 2) + skor terbaik pribadi | Satu putaran Rush Hour bisa dimainkan dan skor terbaik tersimpan |
| 3.13 | Uji main akhir pemilik project, ganti sisa placeholder, perbaikan, README, status | Pemilik project menyetujui → MVP Chapter 0–5 selesai |

Catatan: isi level tiap chapter (dialog, data, jawaban) ditulis di awal iterasi chapter itu dan ditinjau pemilik project sebelum dibangun. Di luar Fase 3: materi lanjutan (subquery, CTE, window function), leaderboard (butuh backend), audio, hosting (masih pertanyaan terbuka §13).

## 13. Pertanyaan terbuka

- [x] Framework UI konsol — **React** (diputuskan di perencanaan Fase 1)
- [x] Game engine final — **Phaser 3** (perencanaan Fase 2)
- [x] Gaya visual — **pixel art 16 px** (karakter 16×32, potret 64×64); sumber aset Fase 2 — **placeholder CC0 + buatan sendiri** (lihat §3)
- [x] Kontrol — **keyboard + klik/tap** untuk berjalan (lihat §3)
- [x] Aset final — **tile CC0 + karakter/potret buatan sendiri**, suasana hangat musim gugur dengan satu palet tetap; cadangan beli pack (perencanaan Fase 3, lihat §3)
- [x] Mini case per chapter — **Mini Case** di akhir Chapter 1–4 + **So what?** di sebagian level (perencanaan Fase 3, lihat §5)
- [x] Blokir query ke tabel di luar stasiun — **diblokir** dengan pesan ramah (perencanaan Fase 3, lihat §3, §10)
- [x] Minimap — **tidak**; tab Café map di Journal (perencanaan Fase 3, lihat §3)
- [x] Mata uang — **$ (USD)**
- [ ] Nuansa setting kota (generik/internasional, atau ada sentuhan lokal tertentu)
- [ ] Isi detail tiap level (dialog, data, jawaban) per chapter — Chapter 0 (4 level) dan Chapter 1 (6 level) sudah ditulis, lengkap dengan terjemahan Indonesia
- [x] **Stasiun untuk Chapter 0–1** — stasiun baru **Menu board** di area depan membaca `menu_items` (cocok dengan cerita "Cleaning Up the Menu"); Kitchen tetap untuk `recipes` di Fase 3
- [x] Bentuk Skill Check — **adaptif**, 2 soal per chapter, dibuat setelah Chapter 4 ada (perencanaan Fase 3, lihat §2)
- [ ] Hosting (mis. GitHub Pages / Vercel / Netlify)
