import type { ChapterTranslation } from '../../types';

/**
 * Chapter 2 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter2Id: ChapterTranslation = {
  title: 'Laporan Pertama',
  summary: 'Urutkan, batasi, dan hitung: laporan sungguhan pertamamu.',
  levels: {
    'ch2-1': {
      title: 'Papan Sandwich',
      lesson: {
        title: 'Query buatanmu sendiri, dan ORDER BY',
        body: [
          'Mulai sekarang kamu mengetik seluruh query sendiri. Autocomplete membantu menulis nama tabel dan kolom.',
          'ORDER BY mengurutkan baris berdasarkan satu kolom. ASC (bawaan) dari kecil ke besar; DESC dari besar ke kecil.',
        ],
      },
      dialogue: [
        'Jam makan siang makin ramai, jadi aku mau bikin papan sandwich untuk jendela.',
        'Bisa tampilkan sandwich kita beserta harganya, yang paling mahal di paling atas?',
      ],
      task: 'Tampilkan name dan price dari setiap sandwich, dari yang paling mahal.',
      hints: [
        'Barisnya sudah benar — tinggal diurutkan.',
        'Tambahkan ORDER BY setelah baris WHERE. Arahnya: kecil ke besar, atau besar ke kecil?',
        "… WHERE category = 'sandwich' ORDER BY price DESC;",
      ],
      success: 'Avocado Toast di paling atas, seperti judul berita. Orang bisa membacanya dari seberang jalan!',
    },
    'ch2-2': {
      title: 'Piring Cicip Dessert',
      lesson: {
        title: 'Daftar teratas dengan LIMIT',
        body: [
          'LIMIT n hanya menyimpan n baris pertama. Letaknya selalu paling akhir, setelah ORDER BY.',
          'ORDER BY + LIMIT adalah cara analis membuat daftar "5 teratas" atau "3 terbawah".',
        ],
      },
      dialogue: [
        'Nenek mau mencoba piring cicip dessert setiap hari Minggu.',
        'Carikan tiga dessert kita yang paling murah — itu yang bisa Nenek bagikan dalam potongan kecil.',
      ],
      task: 'Tampilkan name dan price dari 3 dessert termurah, mulai dari yang termurah.',
      hints: [
        'Saring dulu dessert-nya, lalu urutkan, lalu ambil tiga yang pertama.',
        'Urutan klausanya WHERE → ORDER BY → LIMIT.',
        "SELECT name, price FROM menu_items WHERE category = 'dessert' ORDER BY price LIMIT 3;",
      ],
      success: 'Brownie, Apple Pie, dan Cheesecake. Piring cicip seperti itu akan membuat orang kembali untuk sepotong penuh.',
    },
    'ch2-3': {
      title: 'Untuk Buletin',
      lesson: {
        title: 'Setiap nilai sekali: DISTINCT',
        body: [
          'SELECT DISTINCT membuang baris yang sama, jadi setiap nilai hanya muncul sekali.',
          'Ini menjawab pertanyaan "nilai apa saja yang berbeda?"',
        ],
      },
      dialogue: [
        'Saya sedang menulis tentang kafe ini untuk buletin lembah. Kopi terenak di lembah, tentu saja.',
        'Kalian menjual jenis apa saja? Kategorinya saja, masing-masing sekali.',
      ],
      task: 'Tampilkan setiap category di menu, masing-masing hanya sekali.',
      hints: [
        'Kamu hanya butuh satu kolom, tapi tanpa pengulangan.',
        'Satu kata setelah SELECT akan membuang duplikatnya.',
        'SELECT DISTINCT category FROM …;',
      ],
      success: 'Kopi, teh, pastry, sandwich, dessert… dan satu yang kosong? Itu tidak saya masukkan ke artikel.',
      soWhat: {
        question: 'Salah satu category muncul sebagai NULL. Apa artinya?',
        choices: [
          'Ada menu yang belum pernah diberi kategori — datanya perlu dirapikan',
          'Ada kategori rahasia bernama NULL',
          'Menu-menu itu sedang habis',
        ],
        explanation:
          'NULL berarti tidak ada yang mengisi kategorinya (ingat Iced Tea dan Lemonade?). Laporan yang dikelompokkan per kategori akan punya baris misterius sampai datanya diperbaiki.',
      },
    },
    'ch2-4': {
      title: 'Yang Kita Simpan',
      lesson: {
        title: 'Menghitung kolom, dan menamainya dengan AS',
        body: [
          'Kamu bisa menghitung di SELECT: price - cost menghitung margin untuk setiap baris.',
          'AS memberi nama pada kolom baru. Tanpa AS, PostgreSQL menamainya ?column?.',
        ],
      },
      dialogue: [
        'Price adalah yang dibayar pelanggan. Cost adalah biaya kita untuk membuatnya.',
        'Yang kita simpan dari setiap penjualan adalah margin: price dikurangi cost. Bisa hitungkan untuk setiap menu?',
        'Dan tolong namai kolomnya margin, supaya akuntan Nenek mengerti.',
      ],
      task: 'Tampilkan name dan margin (price − cost) dari setiap menu, dengan kolom margin bernama margin.',
      hints: [
        'Kolom kedua adalah hasil hitungan, bukan kolom dari tabel.',
        'Kurangi price dengan cost, lalu beri nama hasilnya dengan AS.',
        'SELECT name, price - cost AS margin FROM …;',
      ],
      success:
        'Jadi Latte memberi kita $2.80, tapi Espresso hanya $1.90. Dan dua menu tidak menunjukkan apa-apa — data yang hilang lagi.',
      soWhat: {
        question:
          'Avocado Toast memberi $4.45 per penjualan dan Espresso $1.90. Apakah Avocado Toast menghasilkan lebih banyak uang untuk Nenek secara keseluruhan?',
        choices: [
          'Belum tentu — tergantung berapa banyak masing-masing terjual',
          'Ya — margin lebih besar selalu berarti uang lebih banyak',
          'Tidak — menu murah selalu menghasilkan lebih banyak secara total',
        ],
        explanation:
          'Total keuntungan = margin × jumlah terjual. Kalau kita menjual sepuluh espresso untuk setiap avocado toast, espresso yang menang. Untuk tahu pastinya, kita butuh data penjualan — itu di Chapter 3.',
      },
    },
    'ch2-5': {
      title: 'Penghasil Terbesar',
      lesson: {
        title: 'Mengurutkan hasil hitungan — dan letak NULL',
        body: [
          'Kamu bisa mengurutkan berdasarkan alias: ORDER BY margin DESC.',
          'Hati-hati: saat mengurutkan DESC, PostgreSQL menaruh nilai NULL paling atas. Buang dengan IS NOT NULL (atau tulis NULLS LAST).',
        ],
      },
      dialogue: [
        'Nenek menunjukkan daftar margin-mu. Aku ingin tahu menu mana yang benar-benar menghidupi kafe.',
        'Beri aku lima menu dengan margin terbesar per penjualan. Buang yang price atau cost-nya kosong — angkanya menipu.',
      ],
      task: 'Tampilkan name dan margin dari 5 menu dengan margin terbesar, dari yang terbesar, tanpa menu yang price atau cost-nya kosong.',
      hints: [
        'Hitung margin, urutkan dari besar ke kecil, ambil lima — dan jangan ikutkan price dan cost yang kosong.',
        'Kalau Hot Chocolate atau Banana Bread muncul di atas, margin NULL mereka diurutkan duluan. Saring dengan WHERE.',
        '… WHERE price IS NOT NULL AND cost IS NOT NULL ORDER BY margin DESC LIMIT 5;',
      ],
      success: 'Sandwich di atas, lalu Secret Cake. Hmm, kita sudah berhenti membuatnya… aku jadi dapat ide.',
    },
    'ch2-6': {
      title: 'Apa yang Harus Kita Promosikan?',
      dialogue: [
        'Nenek bilang aku boleh menampilkan satu minuman di papan tulis besar minggu depan.',
        'Aku mau pilih yang benar-benar menghasilkan uang — bukan cuma yang aku suka membuatnya.',
        'Bisa selidiki menunya, sematkan buktimu, lalu ceritakan temuanmu?',
      ],
      task: 'Cari tahu menu mana yang paling menghasilkan, lalu pilih minuman yang ditampilkan. Sematkan bukti 📌 untuk setiap jawaban.',
      questions: [
        {
          prompt: 'Menu mana di seluruh daftar yang paling menghasilkan per penjualan?',
          choices: ['Avocado Toast', "Grandma's Secret Cake", 'Cheesecake'],
        },
        { prompt: 'Berapa menu yang menghasilkan lebih dari $3.50 per penjualan?' },
        {
          prompt: 'Minuman mana yang sebaiknya ditampilkan di papan tulis?',
          choices: ['Pumpkin Spice Latte', 'Caramel Macchiato', 'Espresso'],
        },
      ],
      hints: [
        'Hitung margin-nya (price − cost AS margin) lalu urutkan. Untuk minuman, lihat coffee dan tea saja.',
        'Menu yang menghasilkan banyak tidak ada gunanya kalau tidak bisa dijual. Kolom mana yang memberi tahu itu?',
        "SELECT name, price - cost AS margin, is_available FROM menu_items WHERE category IN ('coffee', 'tea') ORDER BY margin DESC;",
      ],
      success:
        'Caramel Macchiato saja! Pumpkin Spice Latte memang sedikit lebih untung, tapi sedang tidak dijual. Jeli sekali — aku pasti memilihnya.',
    },
  },
};
