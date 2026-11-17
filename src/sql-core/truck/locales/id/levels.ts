import type { LevelText } from '../../../levels';

/** Indonesian text for the food truck's own requests (keyed by level id). */
export const TRUCK_LEVELS_ID: Record<string, LevelText> = {
  'truck-milk-supplier': {
    title: 'Siapa yang Mengantar Susu?',
    dialogue: ['Susunya akhir-akhir ini rasanya beda.', 'Siapa pemasoknya sekarang, dan jam berapa datangnya?'],
    task: 'Tampilkan name dan delivery_time pemasok susu yang dipakai sekarang (tanggal until-nya kosong).',
    hints: [
      'Ada dua pemasok susu. Yang dipakai sekarang belum punya tanggal berakhir.',
      'Kolom mana yang menyimpan sampai kapan sebuah pemasok dipakai?',
      "… WHERE product = 'milk' AND until IS NULL;",
    ],
    success: 'Highland Dairy, jam dua belas siang? Pantas tadi pagi tidak ada susu.',
  },
  'truck-milk-recipes': {
    title: 'Berapa Banyak Susunya?',
    dialogue: ['Kata dokter aku harus mengurangi susu.', 'Berapa banyak susu di setiap minumanmu?'],
    task: 'Tampilkan item_id dan amount dari setiap baris resep yang memakai susu.',
    hints: [
      'Setiap baris recipes adalah satu bahan dari satu menu.',
      'Nilai teks ditulis di antara tanda kutip satu.',
      "… WHERE ingredient = 'milk';",
    ],
    success: 'Menu nomor 6 cuma 120 ml? Kalau begitu aku pesan yang itu.',
  },
};
