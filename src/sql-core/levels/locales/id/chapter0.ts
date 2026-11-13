import type { ChapterTranslation } from '../../types';

/**
 * Chapter 0 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter0Id: ChapterTranslation = {
  title: 'Hari Pertama',
  summary: 'Grandma mengajakmu mengenal catatan kafe.',
  levels: {
    'ch0-1': {
      title: 'Buku Menu',
      lesson: {
        title: 'Tabel',
        body: [
          'Database menyimpan informasi dalam tabel, seperti lembar di spreadsheet: tiap baris adalah satu hal (satu menu), tiap kolom adalah satu detail tentangnya (nama, harga…).',
          'Untuk melihat tabel, pilih kolom dengan SELECT dan sebut nama tabelnya dengan FROM. Tanda bintang * artinya "semua kolom". Setiap query diakhiri titik koma ; — tanda bagi database bahwa query-mu sudah selesai.',
        ],
      },
      dialogue: [
        'Oh, kamu sudah datang! Selamat datang di kafe, Nak.',
        'Semua yang kita jual tercatat rapi — menunya ada di tabel bernama menu_items.',
        'Coba kamu lihat seluruh isinya.',
      ],
      task: 'Tampilkan semua kolom dari semua menu di tabel menu_items.',
      hints: [
        'Kamu ingin melihat seluruh tabel menu_items, tanpa ada yang terlewat.',
        'Mulai dengan SELECT, lalu * untuk "semua kolom", lalu FROM dan nama tabelnya.',
        'SELECT * FROM … — tabel mana yang berisi menu?',
      ],
      success: 'Itu dia seluruh menunya! Agak berantakan, ya. Nanti kita rapikan sama-sama.',
    },
    'ch0-2': {
      title: 'Namanya Saja',
      lesson: {
        title: 'Memilih satu kolom',
        body: [
          'Selain *, kamu bisa menulis nama kolom yang kamu mau.',
          'Hasilnya hanya berisi kolom itu — lebih mudah dibaca saat kamu cuma butuh satu detail.',
        ],
      },
      dialogue: [
        'Mata Nenek sudah tidak setajam dulu. Kolom sebanyak itu bikin pusing!',
        'Bisa tunjukkan nama-nama yang kita jual saja?',
      ],
      task: 'Tampilkan hanya kolom name dari semua menu.',
      hints: [
        'Kali ini Grandma hanya butuh satu kolom.',
        'Tulis nama kolomnya tepat setelah SELECT, sebagai ganti *.',
        'SELECT name FROM …;',
      ],
      success: 'Jauh lebih baik! Espresso, Latte, Croissant… ya ampun, banyak juga yang kita jual.',
    },
    'ch0-3': {
      title: 'Nama dan Harga',
      lesson: {
        title: 'Beberapa kolom',
        body: [
          'Untuk mengambil lebih dari satu kolom, tulis semuanya setelah SELECT, dipisahkan koma.',
          'Kolom muncul di hasil sesuai urutan yang kamu tulis.',
        ],
      },
      dialogue: [
        'Tadi pagi ada pelanggan yang tanya harga, dan Nenek terpaksa menebak. Malu sekali!',
        'Tolong berikan tiap menu beserta harganya, supaya Nenek bisa membuat daftar harga yang benar.',
      ],
      task: 'Tampilkan name dan price dari semua menu.',
      hints: [
        'Kali ini kamu butuh dua kolom: nama menu dan harga yang dibayar pelanggan.',
        'Tulis kedua nama kolom setelah SELECT, dengan koma di antaranya.',
        'SELECT name, price FROM …;',
      ],
      success: 'Daftar harga sungguhan! Akhirnya Nenek tidak perlu menebak lagi.',
    },
    'ch0-4': {
      title: 'Untung Nggak, Ya?',
      lesson: {
        title: 'Price vs. cost',
        body: [
          'Setiap kafe punya dua angka untuk tiap menu: price (yang dibayar pelanggan) dan cost (biaya untuk membuatnya).',
          'Membandingkan keduanya menunjukkan menu mana yang benar-benar menghasilkan uang. Analis selalu melihat keduanya berdampingan.',
        ],
      },
      dialogue: [
        'Ada hari-hari laci kasir penuh, tapi rekening bank tetap kosong. Nenek tidak pernah mengerti kenapa.',
        'Tunjukkan tiap menu dengan harganya dan biaya kita untuk membuatnya. Mungkin jawabannya ada di situ.',
      ],
      task: 'Tampilkan name, price, dan cost dari semua menu.',
      hints: [
        'Kamu butuh tiga kolom: nama menu, harga untuk pelanggan, dan biaya pembuatannya.',
        'Tulis tiga kolom setelah SELECT, dengan koma di antaranya.',
        'SELECT name, price, cost FROM …;',
      ],
      success:
        'Lihat itu — Avocado Toast butuh hampir tiga dolar untuk membuatnya! Dan Banana Bread tidak punya cost sama sekali? Kita harus cek itu nanti.',
      soWhat: {
        question: 'Dengan price dan cost berdampingan, apa yang bisa Nenek ketahui untuk tiap menu?',
        choices: [
          'Berapa yang Nenek dapat dari setiap porsi terjual (price − cost)',
          'Berapa banyak tiap menu terjual',
          'Menu mana yang paling disukai pelanggan',
        ],
        explanation:
          'Price dikurangi cost adalah keuntungan tiap penjualan — kamu akan menghitungnya di Chapter 2. Jumlah terjual atau menu favorit pelanggan butuh data penjualan: datanya tidak ada di tabel ini.',
      },
    },
  },
};
