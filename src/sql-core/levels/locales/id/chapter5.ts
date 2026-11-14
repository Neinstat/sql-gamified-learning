import type { ChapterTranslation } from '../../types';

/**
 * Chapter 5 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter5Id: ChapterTranslation = {
  title: 'Kasus Analisis',
  summary: 'Penjualan Oktober turun. Setiap ruangan kafe menyimpan petunjuk.',
  levels: {
    'ch5-1': {
      title: 'Siapa Mengirim Apa',
      lesson: {
        title: 'Gudang: suppliers dan inventory',
        body: [
          'suppliers berisi siapa mengirim apa, jam berapa, dan berapa harganya. inventory punya satu baris per hari per bahan: berapa yang datang, dan kapan habisnya (sold_out_at, NULL kalau tidak pernah habis).',
          'Waktu diurutkan seperti jam: ORDER BY delivery_time menaruh pengiriman paling pagi di atas.',
        ],
      },
      dialogue: [
        'Pagi! Saya yang menjaga gudang ini tetap penuh. Selamat datang di kerajaan peti saya.',
        'Nenek ingin tahu siapa mengirim apa, dan kapan. Bisa tampilkan daftar pemasoknya, dari pengiriman paling pagi?',
      ],
      task: 'Tampilkan name, product, dan delivery_time setiap pemasok, dari pengiriman paling pagi.',
      hints: [
        'Satu baris per pemasok, dengan tiga kolom, diurutkan berdasarkan jam pengiriman.',
        'ORDER BY delivery_time (kecil ke besar = pagi ke siang).',
        'SELECT name, product, delivery_time FROM suppliers ORDER BY delivery_time;',
      ],
      success:
        'Valley Dairy jam enam, pemanggang kopi jam tujuh… dan pemasok susu baru, Highland Dairy, jam dua belas siang. Lebih murah, kata Nenek. Kita lihat saja.',
    },
    'ch5-2': {
      title: 'Papan Bulanan',
      lesson: {
        title: 'Komputer Nenek',
        body: [
          'Komputer di kantor belakang bisa melihat semua tabel di kafe: menu, kasir, dapur, dan gudang.',
          'Analisis yang baik dimulai dari gambaran besar: angka-angka utama per bulan.',
        ],
      },
      dialogue: [
        'Ini kantor Nenek, Nak. Komputer tua Kakek masih jalan — dan bisa melihat semuanya.',
        'Sebelum kita menggali, tunjukkan gambaran besarnya: revenue dan jumlah order setiap bulan.',
      ],
      task: "Tampilkan setiap bulan (DATE_TRUNC('month', sold_at), bernama month) dengan revenue dan jumlah order-nya (bernama orders), urut tanggal.",
      hints: [
        'Kelompokkan per bulan, lalu dua angka per bulan: revenue dan jumlah order.',
        'SUM(quantity * unit_price) untuk revenue, COUNT(DISTINCT order_id) untuk orders, GROUP BY month, ORDER BY month.',
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY month ORDER BY month;",
      ],
      success: 'Itu dia, hitam di atas putih. Oktober jauh di bawah September. Sekarang kita cari tahu kenapa.',
      soWhat: {
        question: 'Bandingkan Oktober dengan September. Apa yang paling berubah?',
        choices: [
          'Order-nya lebih sedikit — besar tiap order hanya sedikit mengecil',
          'Order-nya lebih kecil — orang yang sama belanja lebih sedikit',
          'Tidak ada yang penting: satu bulan buruk itu biasa',
        ],
        explanation:
          'Jumlah order turun sekitar 15% (1.547 → 1.311), sedangkan rata-rata order hanya turun dari $6.83 ke $6.58. Orang berhenti datang — atau berhenti membeli sesuatu. Itu jejak yang harus diikuti.',
      },
    },
    'ch5-3': {
      title: 'Penjualan Oktober Turun',
      lesson: {
        title: 'Kasus Analisis: telusuri lebih dalam',
        body: [
          'Pertanyaan sungguhan, tanpa satu query yang benar. Bekerjalah dari gambaran besar ke bawah: berapa? → apa? → kapan? → kenapa?',
          'Sematkan satu hasil untuk setiap jawaban. Komputer ini melihat semua tabel — penyebabnya bisa ada di ruangan lain di kafe.',
          'Alat yang berguna: DATE_TRUNC dan EXTRACT(HOUR FROM sold_at), JOIN dengan menu_items, serta tabel gudang inventory dan suppliers.',
        ],
      },
      dialogue: [
        'Penjualan Oktober turun, dan Nenek sampai tidak bisa tidur. Kafe ini sudah berdiri empat puluh tahun.',
        'Tidak ada yang berubah, pikir Nenek. Menu sama, harga sama, senyum sama.',
        'Kamu sudah menjadi analis sungguhan, Nak. Cari tahu apa yang terjadi — dan tunjukkan buktinya.',
      ],
      task: 'Cari tahu berapa besar revenue Oktober turun, apa yang turun, kapan, dan kenapa. Sematkan bukti 📌 untuk setiap jawaban.',
      questions: [
        { prompt: 'Berapa persen revenue turun dari September ke Oktober?' },
        {
          prompt: 'Menu mana yang kehilangan revenue paling banyak?',
          choices: ['Avocado Toast', 'Latte', "Grandma's Secret Cake"],
        },
        {
          prompt: 'Kapan dalam sehari penjualan Oktober turun?',
          choices: ['Pagi hari, sebelum tengah hari', 'Sekitar jam makan siang', 'Sore hari'],
        },
        {
          prompt: 'Apa penyebab yang paling mungkin?',
          choices: [
            'Pelanggan bosan dengan kopi',
            'Susu habis di pagi hari: pemasok baru baru mengirim jam dua belas siang',
            'Nenek menaikkan harga di bulan Oktober',
          ],
        },
        {
          prompt: 'Apa yang sebaiknya Nenek lakukan?',
          choices: [
            'Hapus minuman susu dari menu',
            'Turunkan harga latte',
            'Minta susu dikirim pagi-pagi lagi, walau sedikit lebih mahal',
          ],
        },
      ],
      hints: [
        'Bandingkan September dan Oktober selangkah demi selangkah: per menu (JOIN menu_items), lalu per jam (EXTRACT(HOUR FROM sold_at)). Lalu kunjungi tabel-tabel gudang.',
        'Penurunannya terjadi di pagi hari dan pada minuman susu. Lihat inventory untuk susu: apakah sold_out_at terisi? Dan siapa yang mengirim susu, jam berapa?',
        "SELECT day, delivered_at, sold_out_at FROM inventory WHERE ingredient = 'milk' AND day >= '2026-09-25' ORDER BY day;",
      ],
      success:
        'Susunya! Menghemat beberapa sen per liter membuat Nenek kehilangan seperlima penjualan. Besok pagi Nenek langsung menelepon Valley Dairy. Terima kasih, Nak — Kakek pasti sangat bangga padamu.',
    },
  },
};
