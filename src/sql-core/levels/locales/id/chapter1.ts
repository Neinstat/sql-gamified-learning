import type { ChapterTranslation } from '../../types';

/**
 * Chapter 1 — Bahasa Indonesia.
 * Rules: SQL keywords, table/column names and data values stay in English.
 */
export const chapter1Id: ChapterTranslation = {
  title: 'Merapikan Menu',
  summary: 'Saring menu dan temukan data yang hilang.',
  levels: {
    'ch1-1': {
      title: 'Jajan Murah',
      lesson: {
        title: 'Menyaring baris dengan WHERE',
        body: [
          'WHERE hanya menyimpan baris yang memenuhi syarat. Letaknya setelah FROM.',
          'Syarat membandingkan kolom dengan nilai: < (kurang dari), > (lebih dari), = (sama dengan), <= dan >=.',
        ],
      },
      dialogue: [
        'Anak-anak sekolah datang tiap sore dengan beberapa koin di saku.',
        'Menu apa saja yang bisa mereka beli dengan harga kurang dari tiga dolar?',
      ],
      task: 'Tampilkan name dan price dari setiap menu dengan harga di bawah $3.',
      hints: [
        'Kamu membandingkan satu kolom dengan angka 3.',
        'Kolom mana yang berisi harga yang dibayar pelanggan?',
        '… WHERE price < 3',
      ],
      success: 'Espresso, Green Tea, Earl Grey… Hmm, mungkin anak-anak juga mau kue yang murah.',
    },
    'ch1-2': {
      title: 'Kopi Saja',
      lesson: {
        title: 'Teks butuh tanda kutip',
        body: [
          "Angka ditulis apa adanya, tapi nilai teks ditulis di dalam tanda kutip tunggal: 'coffee'.",
          "Teks harus sama persis — 'Coffee' dengan huruf C besar adalah nilai yang berbeda.",
        ],
      },
      dialogue: [
        'Halo! Aku barista di sini. Aku lagi menata ulang papan menu kopi di atas meja kasir.',
        'Bisa tampilkan semua minuman kopi beserta harganya? Kategorinya namanya coffee.',
      ],
      task: 'Tampilkan name dan price dari setiap menu dalam kategori coffee.',
      hints: [
        'Bandingkan kolom category dengan kata coffee.',
        'coffee adalah teks, jadi perlu tanda kutip tunggal di sekelilingnya.',
        "… WHERE category = 'coffee'",
      ],
      success: 'Sempurna! Eh tunggu… Pumpkin Spice Latte ada di sini, padahal sudah berminggu-minggu kita tidak membuatnya.',
    },
    'ch1-3': {
      title: 'Yang Ada Hari Ini',
      lesson: {
        title: 'Dua syarat dengan AND',
        body: [
          'AND menggabungkan dua syarat. Baris hanya disimpan kalau keduanya benar.',
          'is_available adalah kolom TRUE/FALSE: menandakan apakah menu itu bisa dibuat hari ini.',
        ],
      },
      dialogue: [
        'Yang tidak bisa kita buat sekarang, kita keluarkan saja.',
        'Aku cuma mau minuman kopi yang tersedia hari ini.',
      ],
      task: 'Tampilkan name dari setiap menu kopi yang tersedia.',
      hints: [
        'Kedua syarat harus benar pada saat yang sama.',
        'Kata apa yang menggabungkan dua syarat sehingga keduanya wajib terpenuhi?',
        "… WHERE category = 'coffee' AND is_available = TRUE",
      ],
      success: 'Delapan minuman. Papannya siap — tidak ada lagi penggemar pumpkin yang kecewa!',
    },
    'ch1-4': {
      title: 'Waktunya Minum Teh',
      lesson: {
        title: 'Salah satu dari beberapa nilai: IN',
        body: [
          "Untuk mencocokkan nilai mana pun dari sebuah daftar, pakai IN: category IN ('tea', 'dessert').",
          "Artinya sama dengan category = 'tea' OR category = 'dessert', tapi lebih singkat.",
        ],
      },
      dialogue: [
        'Bu Hill dari klub buku ingin mengadakan pertemuan di sini setiap Kamis!',
        'Mereka suka teh dengan sesuatu yang manis. Tunjukkan teh dan dessert kita, supaya Nenek bisa menyusun paketnya.',
      ],
      task: 'Tampilkan name dan category dari setiap menu dalam kategori tea atau dessert.',
      hints: [
        'Kategorinya bisa salah satu dari dua nilai.',
        'Kata apa yang mencocokkan nilai dengan daftar di dalam kurung?',
        "… WHERE category IN ('tea', 'dessert')",
      ],
      success: 'Bagus sekali. Seteko Earl Grey dan sepotong Apple Pie — klub buku pasti senang.',
    },
    'ch1-5': {
      title: 'Pencinta Cokelat',
      lesson: {
        title: 'Mencari teks dengan LIKE',
        body: [
          "LIKE mencari teks yang cocok dengan pola. % artinya \"teks apa saja\": '%cake%' cocok dengan apa pun yang mengandung cake.",
          'LIKE membedakan huruf besar dan kecil: %Cake% dan %cake% adalah pola yang berbeda.',
        ],
      },
      dialogue: [
        'Pagi! Aku datang ke sini setiap hari, lho. Dan aku punya satu kelemahan: cokelat.',
        'Menu mana saja yang ada cokelatnya? Jangan cuma cek namanya — ada yang menyembunyikannya!',
      ],
      task: 'Tampilkan name dari setiap menu yang description-nya menyebut chocolate.',
      hints: [
        'Nama menu saja tidak cukup: cari di kolom yang menjelaskan tiap menu.',
        'Pakai kolom description, dan pola dengan % di kedua sisi katanya.',
        "… WHERE description LIKE '%chocolate%'",
      ],
      success: 'Mocha! Aku tidak pernah tahu ada cokelatnya. Kamu bikin mingguku jadi menyenangkan.',
    },
    'ch1-6': {
      title: 'Kepingan yang Hilang',
      lesson: {
        title: 'Nilai kosong: IS NULL',
        body: [
          'NULL artinya "tidak diketahui" — tidak ada yang mengisi nilainya. NULL bukan nol dan bukan teks kosong.',
          'NULL tidak bisa dicari dengan = NULL. Pakai IS NULL (dan IS NOT NULL untuk kebalikannya).',
        ],
      },
      dialogue: [
        'Ingat Banana Bread yang cost-nya tidak tercatat? Nenek jadi khawatir.',
        'Kalau ada harga atau cost yang hilang, hitungan Nenek jadi salah. Cari semua menu yang price atau cost-nya hilang.',
      ],
      task: 'Tampilkan name, price, dan cost dari setiap menu yang price atau cost-nya kosong.',
      hints: [
        'Nilai yang hilang adalah NULL. Kolom mana saja bisa jadi yang kosong.',
        '= NULL tidak pernah cocok dengan apa pun. Ada cara khusus untuk mengecek NULL.',
        '… WHERE price IS NULL OR cost IS NULL',
      ],
      success:
        'Hot Chocolate tanpa harga, dan Banana Bread tanpa cost. Pantas saja hitungan Nenek tidak pernah cocok! Besok Nenek tanya ke pemasok.',
    },
  },
};
