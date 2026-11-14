import type { ChapterTranslation } from '../../types';

/**
 * Chapter 4 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter4Id: ChapterTranslation = {
  title: 'Menghubungkan Titik',
  summary: 'Dapur sudah dibuka! Gabungkan tabel untuk melihat gambaran utuhnya.',
  levels: {
    'ch4-1': {
      title: 'Ke Mana Susunya',
      lesson: {
        title: 'Menggabungkan dua tabel: JOIN … ON',
        body: [
          'recipes hanya tahu nomor menu; namanya ada di menu_items. JOIN menaruh keduanya berdampingan.',
          'ON menentukan baris mana yang berpasangan: r.item_id = m.item_id. Nama pendek r dan m adalah alias untuk tabelnya.',
        ],
      },
      dialogue: [
        'Selamat datang di dapur Nenek, Nak! Hati-hati dengan kompornya. Itu buku resep Nenek di atas penyangga.',
        'Kita menghabiskan banyak sekali susu. Menu apa saja yang memakai susu, dan berapa banyak untuk masing-masing?',
      ],
      task: 'Tampilkan name dari setiap menu yang memakai susu, beserta jumlah susunya.',
      hints: [
        'Gabungkan recipes dengan menu_items lewat nomor menu, lalu ambil baris susunya saja.',
        "ON m.item_id = r.item_id, lalu WHERE r.ingredient = 'milk'.",
        "SELECT m.name, r.amount FROM recipes r JOIN menu_items m ON m.item_id = r.item_id WHERE r.ingredient = 'milk';",
      ],
      success: 'Sepuluh minuman pakai susu! Pantas tukang susu datang setiap pagi.',
    },
    'ch4-2': {
      title: 'Resep yang Hilang',
      lesson: {
        title: 'Menyimpan baris tanpa pasangan: LEFT JOIN',
        body: [
          'JOIN hanya menyimpan baris yang cocok di kedua sisi. LEFT JOIN menyimpan setiap baris tabel pertama, walau tanpa pasangan.',
          'Kalau tidak ada yang cocok, kolom tabel kedua berisi NULL — jadi WHERE … IS NULL menemukan yang hilang.',
        ],
      },
      dialogue: [
        'Aku sedang menulis lembar latihan untuk staf baru, langsung dari buku resep.',
        'Tapi sepertinya ada satu menu yang sama sekali tidak punya resep. Bisa cari yang mana?',
      ],
      task: 'Tampilkan name dari setiap menu yang tidak punya resep di tabel recipes.',
      hints: [
        'Mulai dari menu_items supaya semua menu tetap ada, lalu cari menu yang tidak punya pasangan resep.',
        'LEFT JOIN recipes, lalu WHERE r.recipe_id IS NULL.',
        'SELECT m.name FROM menu_items m LEFT JOIN recipes r ON r.item_id = m.item_id WHERE r.recipe_id IS NULL;',
      ],
      success: 'Grandma\'s Secret Cake! Tentu saja — Nenek tidak pernah menuliskannya. Resepnya hanya ada di kepala Nenek.',
    },
    'ch4-3': {
      title: 'Penjualan per Kategori',
      lesson: {
        title: 'JOIN, lalu GROUP BY',
        body: [
          'sales tahu apa yang terjual, menu_items tahu kategorinya. Gabungkan dulu, baru kelompokkan.',
          'Tulis kolom beserta alias-nya (s.quantity, m.category) supaya jelas berasal dari tabel mana.',
        ],
      },
      dialogue: [
        'Kopi, pastry, sandwich… Aku mau merencanakan pemesanan bahan per kategori.',
        'Berapa porsi yang terjual di setiap kategori? Dari yang terbesar, ya.',
      ],
      task: 'Tampilkan setiap category dengan total porsi terjual (jumlah quantity, bernama units), dari yang terbesar.',
      hints: [
        'Gabungkan sales dengan menu_items, kelompokkan per kategori, lalu jumlahkan quantity-nya.',
        'GROUP BY m.category, SUM(s.quantity) AS units, ORDER BY units DESC.',
        'SELECT m.category, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.category ORDER BY units DESC;',
      ],
      success: 'Kopi jauh di depan. Dan baris NULL itu lagi — Lemonade dan Iced Tea masih butuh kategori!',
    },
    'ch4-4': {
      title: 'Penghasil Uang',
      dialogue: [
        'Sekarang Nenek mau nama, bukan nomor. Menu apa yang paling banyak menghasilkan uang?',
        'Tunjukkan lima teratas berdasarkan revenue.',
      ],
      task: 'Tampilkan name dan revenue (bernama revenue) dari 5 menu dengan revenue tertinggi, dari yang tertinggi.',
      hints: [
        'Gabungkan sales dengan menu_items, jumlahkan revenue per nama menu, urutkan, lalu ambil lima.',
        'GROUP BY m.name, ORDER BY revenue DESC, LIMIT 5.',
        'SELECT m.name, SUM(s.quantity * s.unit_price) AS revenue FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.name ORDER BY revenue DESC LIMIT 5;',
      ],
      success: 'Latte, di depan semuanya. Latte kesayangan Nenek, jantung kafe ini.',
      soWhat: {
        question: 'Avocado Toast menghasilkan paling banyak per penjualan (Chapter 2), tapi Latte mendatangkan jauh lebih banyak uang. Kenapa?',
        choices: ['Latte terjual jauh lebih sering', 'Latte lebih mahal', 'Data Avocado Toast hilang'],
        explanation:
          'Revenue adalah harga × jumlah terjual. Sekitar 700 latte dibanding sekitar 220 avocado toast: jumlah yang menang. Karena itu, kehilangan penjualan Latte akan paling terasa.',
      },
    },
    'ch4-5': {
      title: 'Paling Setia',
      dialogue: [
        'Kata Nenek, mesin kasir sekarang mengenal pelanggan lewat namanya. Ha! Pasti saya ada di paling atas.',
        'Siapa yang paling banyak memesan? Satu nama saja, beserta jumlah order-nya.',
      ],
      task: 'Tampilkan name dan jumlah order (bernama orders) dari pelanggan dengan order terbanyak.',
      hints: [
        'Gabungkan sales dengan customers, hitung setiap order sekali per pelanggan, urutkan, lalu ambil yang teratas.',
        'COUNT(DISTINCT s.order_id) per c.name, ORDER BY orders DESC LIMIT 1.',
        'SELECT c.name, COUNT(DISTINCT s.order_id) AS orders FROM sales s JOIN customers c ON c.customer_id = s.customer_id GROUP BY c.name ORDER BY orders DESC LIMIT 1;',
      ],
      success: 'Tara Ross? Tiga puluh delapan order! Wah. Sepertinya saya harus lebih sering datang.',
    },
    'ch4-6': {
      title: 'Daftar, Tapi Tak Pernah Datang',
      dialogue: [
        'Ada orang yang mengisi kartu pelanggan di counter… lalu tidak pernah kelihatan lagi.',
        'Pelanggan mana yang sama sekali belum pernah memesan?',
      ],
      task: 'Tampilkan name dari setiap pelanggan yang sama sekali tidak punya penjualan.',
      hints: [
        'Mulai dari customers, simpan semuanya, lalu cari yang tidak punya pasangan penjualan.',
        'LEFT JOIN sales, lalu WHERE s.sale_id IS NULL.',
        'SELECT c.name FROM customers c LEFT JOIN sales s ON s.customer_id = c.customer_id WHERE s.sale_id IS NULL;',
      ],
      success: 'Lima nama. Nenek akan kirimi mereka kartu berisi kue gratis. Mungkin mereka hanya butuh alasan.',
    },
    'ch4-7': {
      title: 'Ke Mana Para Pelanggan Tetap?',
      dialogue: [
        'Tahu tidak, beberapa teman ngopi saya berhenti datang. Dulu saya bertemu mereka setiap minggu.',
        'Lily, Noah… Saya rindu obrolan sore kami. Apa ada sesuatu yang terjadi?',
        'Kamu memegang ingatan mesin kasir. Cari tahu siapa yang berhenti datang dan kenapa — lalu tunjukkan buktinya.',
      ],
      task: 'Temukan pelanggan tetap yang berhenti datang dan apa yang dulu mereka pesan. Sematkan bukti 📌 untuk setiap jawaban.',
      questions: [
        { prompt: 'Berapa pelanggan tetap (10 order atau lebih) yang tidak kembali sejak akhir Agustus?' },
        {
          prompt: 'Apa yang paling sering mereka pesan?',
          choices: ['Latte', "Grandma's Secret Cake", 'Cappuccino'],
        },
        {
          prompt: 'Apa cara terbaik untuk membuat mereka kembali?',
          choices: [
            "Hadirkan lagi Grandma's Secret Cake, walau hanya sebagai menu spesial akhir pekan",
            'Kirimi mereka diskon latte',
            'Tidak perlu — pelanggan tetap memang akhirnya pergi',
          ],
        },
      ],
      hints: [
        'Cari dulu pelanggan dengan banyak order yang kunjungan terakhirnya di bulan Agustus. Lalu lihat apa yang dibeli pelanggan itu.',
        'Gabungkan customers dan sales, GROUP BY per pelanggan, lalu pakai HAVING dengan COUNT(DISTINCT order_id) dan MAX(sold_at).',
        'SELECT m.name, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id WHERE s.customer_id IN (3, 7, 11, 14) GROUP BY m.name ORDER BY units DESC;',
      ],
      success:
        'Secret Cake! Mereka datang demi kue Nenek, dan ketika kue itu hilang dari menu, mereka ikut pergi. Akan saya beri tahu Nenek sekarang juga.',
    },
  },
};
