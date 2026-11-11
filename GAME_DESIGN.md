# Kafe Warisan — Dokumen Desain Game

> Game web interaktif untuk belajar SQL sambil belajar **berpikir seperti analis Business Intelligence (BI)**.
> Status: desain awal (MVP). Dokumen ini adalah sumber kebenaran untuk keputusan desain — perbarui saat ada keputusan baru.

---

## 1. Visi

Kebanyakan sumber belajar SQL hanya mengajarkan **sintaks**:

- **SQLBolt**: kurva belajar landai dan mudah diikuti, tapi kurang interaktif dan kurang seru.
- **LeetCode**: interaktif, tapi studi kasusnya sering melompat terlalu sulit untuk pemula.

**Kafe Warisan** mengajarkan SQL dengan kurva landai seperti SQLBolt, dibungkus mekanik game yang membuat pemain ingin lanjut, dan berujung pada kemampuan yang dipakai di dunia kerja: **menjawab pertanyaan bisnis dengan data** — sampai level "penjualan bulan lalu turun, apa penyebabnya?".

## 2. Target pemain

| Pemain | Jalur |
|---|---|
| **Pemula total** (belum pernah menulis SQL) | Mulai dari Bab 0 (tutorial) |
| **Sudah tahu dasar** | Ikut **Uji Kemampuan** di awal → boleh langsung lompat ke bab yang sesuai |

Target akhir: orang yang ingin berkarier sebagai **analis data / BI**, yang perlu paham SQL *dan* konteks bisnis.

## 3. Konsep & cerita

Pemain mewarisi **kafe milik nenek** yang sedang kesulitan. Catatan kafe tersimpan di database yang berantakan. Pemain berperan sebagai **analis data** bisnis keluarga ini.

- **Fokus: simulasi bisnis**, bukan misteri besar. Cerita berupa episode kecil per bab.
- Pertanyaan naik kelas mengikuti jenjang karier analis:

| Tahap | Jenis pertanyaan | Contoh |
|---|---|---|
| Mengambil data | "Tolong tampilkan…" | "Menu apa saja yang harganya di bawah 20 ribu?" |
| Melaporkan | "Berapa / mana yang paling…" | "5 menu terlaris minggu ini?" |
| Mengukur KPI | "Bagaimana performa…" | "Omzet, jumlah transaksi, dan rata-rata nilai belanja per hari?" |
| Menganalisis | "Kenapa…?" | "Penjualan Oktober turun 18%. Apa penyebabnya?" |

**Tokoh** (pemberi permintaan): Nenek (pemilik), barista, supplier, pelanggan tetap. Masing-masing punya gaya bicara sendiri.

## 4. Core loop (per level)

1. **Permintaan** — tokoh meminta sesuatu lewat dialog, disertai target yang jelas.
2. **Eksplorasi** — pemain melihat daftar tabel, kolom, dan isi tabel.
3. **Query** — pemain menulis SQL lalu menjalankannya; hasil ditampilkan dengan **animasi** (baris tersaring memudar, dua tabel menyatu saat JOIN, baris berkelompok saat GROUP BY).
4. **Validasi** — hasil dibandingkan dengan jawaban benar. Jika salah, umpan balik spesifik (mis. "hasilmu 12 baris, seharusnya 3", "kolom `harga` belum ada").
5. **Reward** — koin, XP, dan bintang 1–3.
6. **Kafe tumbuh** — koin dipakai untuk upgrade kafe.

### Validasi jawaban
- Yang dinilai adalah **hasil query**, bukan teks query — banyak cara benar menulis SQL.
- Urutan baris hanya dinilai bila permintaan memang menuntut urutan (ada `ORDER BY` di jawaban).
- Nama kolom/alias dinilai longgar kecuali level secara eksplisit mengajarkan alias.

## 5. Jenis level

| Jenis | Deskripsi | Mulai dari |
|---|---|---|
| **Permintaan** | Satu pertanyaan, satu hasil yang benar | Bab 0 |
| **Laporan** | Hasil dengan format kolom tertentu (top-N, KPI) | Bab 2 |
| **Kasus Analisis** 🎯 | Investigasi terbuka (lihat di bawah) | Bab 5 |
| **Jam Sibuk** ⏱ | Mode tantangan berwaktu: permintaan datang bertubi-tubi | Terbuka setelah Bab 2 |

### Kasus Analisis (pembeda utama)
- Pemain diberi masalah bisnis terbuka, mis. **"Penjualan Oktober turun 18%. Kenapa?"**
- Pemain bebas menjalankan **banyak query** untuk menyelidiki (*drill-down* per menu, hari, jam, kanal penjualan, dst.).
- Pemain menjawab **pertanyaan kesimpulan bertahap** (mis. "Penurunan terbesar di menu apa?", "Di jam berapa?", "Kemungkinan penyebabnya?").
- Setiap jawaban harus **didukung query bukti** yang disematkan (📌) ke catatan investigasi.
- Data disiapkan agar ada satu cerita penyebab yang konsisten (mis. stok susu sering habis di jam pagi → penjualan kopi susu turun).

## 6. Cara input (bertahap)

| Tahap | Level | Cara |
|---|---|---|
| Blok | Awal Bab 0 | Menyusun query dari blok kata yang disediakan (seperti puzzle) |
| Isi bagian kosong | Bab 1 | Query sudah sebagian jadi, pemain mengisi bagian yang hilang |
| Ketik bebas | Bab 2 dst. | Editor SQL penuh dengan syntax highlighting dan **autocomplete** nama tabel/kolom |

## 7. Peta bab MVP (± 18–20 level)

| Bab | SQL | Skill bisnis | Input |
|---|---|---|---|
| **0. Hari Pertama** | Apa itu tabel, `SELECT`, `FROM` | Mengenali data menu & harga | Blok |
| **1. Membereskan Menu** | `WHERE`, `AND`/`OR`, `IN`, `LIKE`, `IS NULL` | Menyaring data, menemukan **data kotor/kosong** | Isi kosong |
| **2. Laporan Pertama** | `ORDER BY`, `LIMIT`, `DISTINCT`, alias, kolom hitungan | Top-N, margin = harga − modal | Bebas |
| **3. Angka Bicara** | `COUNT`, `SUM`, `AVG`, `MIN`/`MAX`, `GROUP BY`, `HAVING`, dasar tanggal | **KPI**: omzet, jumlah transaksi, rata-rata nilai belanja | Bebas |
| **4. Menghubungkan Data** | `INNER JOIN`, `LEFT JOIN`, JOIN + agregasi | Penjualan per kategori, pelanggan yang tidak kembali | Bebas |
| **5. Kasus Analisis** 🎯 | Gabungan semua materi | Investigasi "penjualan turun, kenapa?" | Bebas, multi-query |

Di luar MVP (nanti): subquery, CTE, window function, analisis waktu lanjutan (MoM/YoY), `INSERT`/`UPDATE`, bab cabang kafe baru.

## 8. Progres & reward

- **XP & level pemain** — dari menyelesaikan level.
- **Bintang per level**: ⭐ benar · ⭐⭐ benar tanpa petunjuk · ⭐⭐⭐ menyelesaikan tantangan bonus (mis. tanpa salah, atau syarat tambahan).
- **Koin** — untuk upgrade kafe.
- **Streak harian** 🔥 — main minimal satu level per hari.
- **Petunjuk bertingkat** (maks. 3 per level): arah umum → klausa yang dibutuhkan → hampir jadi. Memakai petunjuk mengurangi bintang, bukan menghalangi progres.
- **Badge** untuk pencapaian (mis. "JOIN pertama", "Analis Sejati" setelah Bab 5).

## 9. Kafe yang tumbuh

- **Penting, tapi sederhana**: ilustrasi kafe 2D dengan beberapa tahap visual.
- Upgrade dengan koin: kursi bertambah, dekorasi, papan menu baru, pelanggan makin ramai.
- Kafe yang tumbuh = bukti visual progres belajar pemain.

## 10. Keputusan teknis

| Topik | Keputusan | Alasan |
|---|---|---|
| Platform | **Web app** di browser | Mudah diakses, mudah dibagikan |
| Backend | **Tanpa backend** untuk MVP | Gratis di-hosting, cepat jadi; progres disimpan lokal di browser |
| Engine SQL | **PostgreSQL di browser via PGlite** | Dialek paling dekat dengan dunia kerja BI (Postgres, Redshift, BigQuery, Snowflake) |
| Kompetisi | **Jam Sibuk + skor terbaik pribadi** | Leaderboard antar pemain menyusul setelah ada backend |
| Bahasa | Bahasa Indonesia | Target awal pemain Indonesia |

## 11. Data game

- Database kafe dibuat **realistis**: menu, kategori, harga & modal, penjualan per transaksi (dengan tanggal & jam), pelanggan, pegawai/shift, stok, supplier, kanal penjualan (dine-in, takeaway, ojol).
- Sengaja diberi **data kotor** (nilai kosong, duplikat, salah ketik) di level tertentu — karena itu kenyataan di dunia kerja.
- Data Kasus Analisis dirancang dengan pola tersembunyi yang bisa ditemukan lewat query.

## 12. Pertanyaan terbuka

- [ ] Framework frontend (diputuskan saat perencanaan implementasi)
- [ ] Gaya visual / ilustrasi kafe
- [ ] Isi detail tiap level (dialog, data, jawaban) per bab
- [ ] Bentuk Uji Kemampuan (berapa soal, bagaimana menentukan bab awal)
- [ ] Hosting (mis. GitHub Pages / Vercel / Netlify)
