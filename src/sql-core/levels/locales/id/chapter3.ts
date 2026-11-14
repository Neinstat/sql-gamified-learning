import type { ChapterTranslation } from '../../types';

/**
 * Chapter 3 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter3Id: ChapterTranslation = {
  title: 'Angka Bicara',
  summary: 'Ubah catatan mesin kasir menjadi angka yang selalu ditanyakan pemilik kafe.',
  levels: {
    'ch3-1': {
      title: 'Aplikasi Pesan Antar',
      lesson: {
        title: 'Menghitung baris: COUNT(*)',
        body: [
          'Tabel sales punya satu baris untuk setiap item yang terjual. COUNT(*) menghitung baris dan menghasilkan satu angka.',
          'COUNT(*) bekerja bersama WHERE: baris disaring dulu, lalu yang tersisa dihitung.',
        ],
      },
      dialogue: [
        'Aplikasi pesan antar berbunyi terus seharian. Kata Nenek, itu tidak terlalu berpengaruh.',
        'Berapa baris penjualan yang masuk lewat pesan antar? Nama channel-nya delivery.',
      ],
      task: 'Hitung jumlah baris di sales yang channel-nya delivery.',
      hints: [
        'Kamu butuh satu angka: berapa baris yang cocok.',
        "Saring dengan WHERE channel = 'delivery', lalu hitung dengan COUNT(*).",
        "SELECT COUNT(*) FROM sales WHERE channel = 'delivery';",
      ],
      success: 'Hampir seribu! Itu bukan angka kecil. Akan kutunjukkan ke Nenek.',
    },
    'ch3-2': {
      title: 'Semua Uangnya',
      lesson: {
        title: 'Menjumlahkan: SUM',
        body: [
          'SUM menjumlahkan sebuah kolom di semua baris. Hasil hitungan juga bisa dijumlahkan.',
          'Revenue adalah uang yang dibayar pelanggan: quantity × unit_price, dijumlahkan di setiap penjualan.',
        ],
      },
      dialogue: [
        'Ini mesin kasirnya, Nak. Tiga bulan penjualan, Agustus sampai Oktober.',
        'Berapa total uang yang masuk? Namai revenue.',
      ],
      task: 'Tampilkan total revenue (jumlah quantity × unit_price di semua penjualan), dengan nama revenue.',
      hints: [
        'Setiap baris menghasilkan quantity × unit_price. Jumlahkan di semua baris.',
        'Taruh hitungannya di dalam SUM( … ) lalu namai hasilnya dengan AS.',
        'SELECT SUM(quantity * unit_price) AS revenue FROM sales;',
      ],
      success: 'Lebih dari tiga puluh ribu dolar! Kakek pasti tidak akan percaya.',
    },
    'ch3-3': {
      title: 'Rata-rata per Order',
      lesson: {
        title: 'Menghitung setiap order sekali: COUNT(DISTINCT), dan ROUND',
        body: [
          'Satu order bisa punya beberapa baris (latte dan croissant). COUNT(DISTINCT order_id) menghitung setiap order sekali saja.',
          'Rata-rata nilai order = revenue ÷ jumlah order. ROUND(x, 2) menyisakan dua angka desimal, seperti uang.',
        ],
      },
      dialogue: [
        'Akuntan Nenek selalu menanyakan dua hal: berapa jumlah order, dan berapa yang dibelanjakan pelanggan per order.',
        'Bisa berikan keduanya? Yang kedua dibulatkan ke sen, ya.',
      ],
      task: 'Tampilkan jumlah order (orders) dan rata-rata nilai order (revenue ÷ orders, dibulatkan 2 desimal, avg_order_value).',
      hints: [
        'Orders: hitung setiap order_id sekali. Rata-rata nilai order: total revenue dibagi jumlah itu.',
        'COUNT(DISTINCT order_id) untuk orders; ROUND( SUM(…) / COUNT(DISTINCT order_id), 2 ) untuk rata-ratanya.',
        'SELECT COUNT(DISTINCT order_id) AS orders, ROUND(SUM(quantity * unit_price) / COUNT(DISTINCT order_id), 2) AS avg_order_value FROM sales;',
      ],
      success: 'Sekitar enam tujuh puluh lima per order. Sekarang Nenek bisa menjawab akuntan tanpa terbata-bata!',
      soWhat: {
        question: 'Kenapa tidak pakai AVG(quantity * unit_price) saja untuk rata-rata nilai order?',
        choices: [
          'AVG merata-ratakan baris (satu item), bukan order utuh — jadi hasilnya terlalu kecil',
          'AVG hanya bisa untuk bilangan bulat',
          'Hasilnya sama persis, hanya lebih lambat',
        ],
        explanation:
          'Setiap baris adalah satu item, jadi AVG memberi sekitar $4.02 per item. Satu order sering berisi dua atau tiga item, jadi rata-rata order sebenarnya sekitar $6.76. Selalu tanyakan: rata-rata dari apa?',
      },
    },
    'ch3-4': {
      title: 'Dari Mana Uangnya',
      lesson: {
        title: 'Satu angka per kelompok: GROUP BY',
        body: [
          'GROUP BY mengumpulkan baris dengan nilai yang sama; SUM dan COUNT lalu bekerja per kelompok.',
          'Setiap kolom di SELECT harus ada di GROUP BY atau berada di dalam SUM, COUNT, AVG, MIN, atau MAX.',
        ],
      },
      dialogue: [
        'Makan di tempat, bawa pulang, pesan antar… Aku ingin tahu mana yang benar-benar menghasilkan.',
        'Revenue untuk setiap channel, dari yang terbesar?',
      ],
      task: 'Tampilkan setiap channel dengan revenue-nya (bernama revenue), dari revenue terbesar.',
      hints: [
        'Satu baris per channel, dengan revenue dijumlahkan di dalam tiap channel.',
        'GROUP BY channel, lalu ORDER BY revenue DESC di akhir.',
        'SELECT channel, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY channel ORDER BY revenue DESC;',
      ],
      success: 'Makan di tempat lebih dari separuh semuanya. Orang masih suka duduk menikmati kopi Nenek.',
    },
    'ch3-5': {
      title: 'Bulan demi Bulan',
      lesson: {
        title: 'Tanggal: DATE_TRUNC',
        body: [
          "DATE_TRUNC('month', sold_at) memotong tanggal dan jam menjadi awal bulannya.",
          'Kelompokkan berdasarkan itu untuk mendapat satu baris per bulan — awal dari setiap laporan tren.',
        ],
      },
      dialogue: [
        'Ada yang mengganjal pikiran Nenek. Laci kasir terasa lebih ringan akhir-akhir ini.',
        "Tunjukkan revenue setiap bulan, berurutan. Pakai DATE_TRUNC('month', sold_at) untuk bulannya.",
      ],
      task: "Tampilkan setiap bulan (DATE_TRUNC('month', sold_at), bernama month) dengan revenue-nya (bernama revenue), urut tanggal.",
      hints: [
        'Kelompokkan penjualan per bulan, jumlahkan revenue di tiap bulan, lalu urutkan berdasarkan bulan.',
        "GROUP BY DATE_TRUNC('month', sold_at) — atau alias-nya, month — lalu ORDER BY month.",
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY month ORDER BY month;",
      ],
      success: 'Agustus, September… dan Oktober paling rendah. Sudah Nenek duga. Ada sesuatu yang terjadi di bulan Oktober.',
      soWhat: {
        question: 'Oktober jauh di bawah September. Apa yang sebaiknya Nenek lakukan lebih dulu?',
        choices: [
          'Cari tahu dari mana penurunannya — menu apa, hari apa, jam berapa',
          'Turunkan semua harga supaya pelanggan kembali',
          'Tunggu November: mungkin akan membaik sendiri',
        ],
        explanation:
          'Angka total hanya memberi tahu bahwa ada yang berubah, bukan apa yang berubah. Analis menelusuri lebih dalam — per menu, hari, jam, channel — sebelum bertindak. Kesempatanmu datang di Chapter 5.',
      },
    },
    'ch3-6': {
      title: 'Paling Laris',
      lesson: {
        title: 'Menyaring kelompok: HAVING',
        body: [
          'WHERE menyaring baris sebelum dikelompokkan. HAVING menyaring kelompok sesudahnya, memakai SUM, COUNT, dan kawan-kawannya.',
          'Hati-hati di batasnya: > 400 berarti lebih dari 400, jadi tepat 400 tidak ikut. >= 400 akan mengikutkannya.',
        ],
      },
      dialogue: [
        'Aku memesan susu dan biji kopi sesuai berapa banyak yang terjual. Mesin kasir hanya mengenal menu lewat nomor.',
        'Nomor menu mana yang terjual lebih dari 400 porsi? Yang itu tidak boleh sampai habis.',
      ],
      task: 'Tampilkan item_id dan total porsi terjual (jumlah quantity, bernama units) dari setiap menu yang terjual lebih dari 400 porsi.',
      hints: [
        'Jumlahkan quantity per item_id, lalu simpan hanya kelompok di atas 400.',
        'SUM tidak bisa dipakai di WHERE. Saring kelompoknya dengan HAVING SUM(quantity) > 400.',
        'SELECT item_id, SUM(quantity) AS units FROM sales GROUP BY item_id HAVING SUM(quantity) > 400;',
      ],
      success: 'Menu 1 sampai 4 — espresso, americano, cappuccino, dan latte. Kopi yang menghidupi kafe ini. Dan menu 6 nyaris masuk!',
    },
    'ch3-7': {
      title: 'Hari yang Sepi',
      lesson: {
        title: 'Tips Mini Case: hari dalam seminggu',
        body: [
          'EXTRACT(DOW FROM sold_at) memberi hari dalam seminggu sebagai angka: 0 = Minggu, 1 = Senin … 6 = Sabtu.',
          'Kelompokkan berdasarkan itu untuk membandingkan hari. Ingat KPI-nya: revenue, jumlah order, rata-rata nilai order.',
        ],
      },
      dialogue: [
        'Ada hari-hari kafe terasa begitu sepi sampai Nenek bisa mendengar detak jam.',
        'Apa itu cuma perasaan Nenek, atau memang ada satu hari yang lebih sepi? Kalau iya — kenapa?',
        'Telusuri catatan kasir, sematkan buktimu, lalu ceritakan apa yang sebaiknya kita lakukan.',
      ],
      task: 'Temukan hari yang sepi dan alasannya. Sematkan bukti 📌 untuk setiap jawaban.',
      questions: [
        { prompt: 'Hari apa yang menghasilkan revenue paling kecil?', choices: ['Senin', 'Selasa', 'Minggu'] },
        {
          prompt: 'Kenapa hari itu sepi?',
          choices: [
            'Order-nya lebih sedikit — tapi besar tiap order kurang lebih biasa',
            'Order-nya lebih kecil — jumlah orangnya sama tapi belanjanya lebih sedikit',
            'Lebih sedikit dan lebih kecil sekaligus',
          ],
        },
        {
          prompt: 'Kata pelanggan tetap, hari Selasa adalah hari pasar — seisi lembah pergi ke pasar. Ide apa yang paling baik?',
          choices: [
            'Promo bawa pulang hari pasar untuk orang yang lewat menuju pasar',
            'Naikkan harga di hari Selasa untuk menutup selisihnya',
            'Tutup kafe setiap hari Selasa',
          ],
        },
      ],
      hints: [
        'Kelompokkan berdasarkan hari dalam seminggu dan bandingkan revenue-nya. Lalu bandingkan jumlah order dan rata-rata order-nya.',
        'COUNT(DISTINCT order_id) memberi jumlah order per hari; revenue ÷ orders memberi rata-rata nilai order.',
        'SELECT EXTRACT(DOW FROM sold_at) AS weekday, SUM(quantity * unit_price) AS revenue, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY weekday ORDER BY weekday;',
      ],
      success:
        'Orangnya yang lebih sedikit, bukan belanjanya — tentu saja, semua sedang di pasar! Promo bawa pulang hari pasar… Nenek akan melukis papannya malam ini.',
    },
  },
};
