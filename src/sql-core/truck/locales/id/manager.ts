import type { LevelText } from '../../../levels';
import type { ManagerIntro } from '../../manager';

/** Indonesian text for The Manager's case (channel names are data, so they stay English). */
export const MANAGER_CASE_ID: LevelText = {
  title: 'Angka. Sekarang.',
  dialogue: [
    '*Tok tok.*',
    'Valley Eats Co., manajer wilayah. Saya tidak suka basa-basi.',
    'Tiga angka sebelum saya pergi: berapa pesanan hari ini, berapa pendapatan hari ini, dan channel terbaik kita bulan lalu.',
    'Sematkan buktinya. Saya tidak percaya perasaan. Saya percaya baris data.',
  ],
  task: 'Jawab tiga pertanyaan The Manager, masing-masing dengan hasil query yang disematkan 📌.',
  hints: [
    "Setiap penjualan truck punya channel = 'truck'. Hari ini adalah satu tanggal: bandingkan sold_at::date dengan tanggal itu.",
    'Muat query awal, isi bagian kosong, jalankan, lalu sematkan 📌 hasilnya sebelum menjawab.',
    "Isian: 'truck' · tanggal hari ini dalam tanda kutip · '2026-11-01' (sehari setelah Oktober berakhir).",
  ],
  success: 'Hm. Benar. Jangan besar kepala. Besok jam yang sama.',
  questions: [
    { prompt: 'Berapa pesanan yang dilayani truck hari ini?' },
    { prompt: 'Berapa pendapatan truck hari ini, dalam dolar?' },
    { prompt: 'Channel mana yang menghasilkan pendapatan terbesar di bulan Oktober?' },
  ],
};

/** Indonesian text for the talk at the back door. */
export const MANAGER_INTRO_ID: ManagerIntro = {
  lines: [
    '*Tok tok.*',
    'Valley Eats Co., manajer wilayah. Saya tidak suka basa-basi.',
    'Tiga angka sebelum saya pergi: berapa pesanan hari ini, berapa pendapatan hari ini, dan channel terbaik kita bulan lalu.',
  ],
  replies: [
    { label: 'Siap, sekarang juga.', answer: 'Bagus. Sematkan buktinya. Saya tidak percaya perasaan. Saya percaya baris data.' },
    {
      label: 'Boleh saya selesaikan pelanggan ini dulu?',
      answer: 'Tidak. Angka dulu. Jam pelangganmu toh sedang berhenti — jam saya tidak.',
    },
    {
      label: 'Channel itu apa?',
      answer: 'Dine-in, takeaway, delivery: dari mana uang masuk. Itu kolom di tabel sales. Lihat sendiri.',
    },
  ],
  open: 'Buka kasusnya 📋',
};

