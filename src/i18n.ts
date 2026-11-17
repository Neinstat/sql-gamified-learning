import { useState } from 'react';
import type { Lang } from './sql-core/feedback';
import { STATION_NAMES, type StationId } from './sql-core/stations';

export type { Lang };

/** UI text in every language. Level text lives in sql-core/levels. */
const en = {
  loading: "Opening the truck's records…",
  loadError: 'Could not open the records:',
  tables: 'Tables',
  run: 'Run',
  running: 'Running…',
  stop: 'Stop',
  rowsShown: (shown: number, total: number) => `Showing the first ${shown} of ${total} rows`,
  shortcut: 'or press Ctrl/⌘ + Enter',
  rows: (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`,
  chapter: (n: number) => `Chapter ${n}`,
  task: 'Your task',
  showLesson: 'Show the lesson again',
  hideLesson: 'Hide the lesson',
  correct: 'Correct!',
  language: 'Language',
  hintButton: (used: number, total: number) => (used === 0 ? 'Need a hint?' : `Another hint (${used}/${total})`),
  hintTitle: (n: number) => `Hint ${n}`,
  levels: 'Levels',
  dialogueClose: 'Close',
  stations: STATION_NAMES.en as Record<StationId, string>,
  backToTruck: 'Back to the truck',
  retry: 'Try again',
  truckOrder: 'Order',
  truckTablet: (app: string) => `Tablet · ${app}`,
  truckControls: 'WASD: walk · mouse: look · E or click: use · Esc: free the mouse',
  truckStart: 'Click to look around',
  truckStartHint: 'WASD to walk, the mouse to look. Aim at the tablet and press E.',
  truckAnswer: 'Aim at the tablet and press E',
  truckSoon: (thing: string) => `${thing}: you can use this in the next update.`,
  truckThings: {
    fridge: 'Fridge & stock',
    tablet: 'Tablet',
    'menu-board': 'Menu board',
    'recipe-shelf': 'Recipe binders',
    'back-door': 'Back door',
  } as Record<string, string>,
  truckServed: 'Correct! The order is ready.',
  truckServe: 'Hand over the order',
  blocksAnswer: 'Your query',
  blocksTray: 'Available blocks',
  blocksEmpty: 'Tap the blocks below to build your query',
  blocksHelp: 'Tap a placed block to remove it.',
  blocksClear: 'Clear',
  blankLabel: (n: number, total: number) => `Blank ${n} of ${total}`,
  fillHelp: 'Fill in the blanks, then press Run (or Enter).',
  starters: 'Starting queries',
  starterLoad: (n: number) => `Load query ${n}`,
  starterHelp: 'Load one into the editor, change it, and run it. A ___ is yours to fill in.',
  pin: '📌 Pin to notes',
  pinned: '📌 Pinned',
  notes: 'Investigation notes',
  notesEmpty: 'No pins yet. Run a query, then pin a result that matters.',
  pinLabel: (n: number, rows: number) => `📌 ${n} · ${rows} ${rows === 1 ? 'row' : 'rows'}`,
  unpin: 'Remove pin',
  conclusions: 'Conclusions',
  conclusionsHelp: 'Answer each question and pick the 📌 pinned result that proves it.',
  answerPlaceholder: 'Your answer',
  evidence: 'Evidence',
  chooseEvidence: 'Choose a 📌 pin…',
  check: 'Check',
  backedByData: 'Backed by data',
  soWhat: 'So what?',
  soWhatRight: 'Exactly.',
  starsLabel: (n: number) => `${n} of 3 stars`,
  starsPerfect: 'Perfect — no hints, no mistakes!',
  starsTipHints: 'Solve it without hints for ★★. Replay it any time from the Journal.',
  starsTipRuns: 'Get it right on the first run for ★★★.',
  starsTipConclusions: 'Answer every question without a wrong conclusion for ★★★.',
  starsBest: (n: number) => `Your best is still ${'★'.repeat(n)}.`,
  coins: 'Coins',
  streak: (n: number) => `${n}-day streak`,
  rushBest: (n: number) => `Your best: ${n}`,
};

export type UiText = typeof en;

const id: UiText = {
  loading: 'Membuka catatan truck…',
  loadError: 'Catatan tidak bisa dibuka:',
  tables: 'Tabel',
  run: 'Jalankan',
  running: 'Menjalankan…',
  stop: 'Hentikan',
  rowsShown: (shown, total) => `Menampilkan ${shown} dari ${total} baris pertama`,
  shortcut: 'atau tekan Ctrl/⌘ + Enter',
  rows: (n) => `${n} baris`,
  chapter: (n) => `Chapter ${n}`,
  task: 'Tugasmu',
  showLesson: 'Lihat materi lagi',
  hideLesson: 'Sembunyikan materi',
  correct: 'Benar!',
  language: 'Bahasa',
  hintButton: (used, total) => (used === 0 ? 'Butuh petunjuk?' : `Petunjuk lagi (${used}/${total})`),
  hintTitle: (n) => `Petunjuk ${n}`,
  levels: 'Level',
  dialogueClose: 'Tutup',
  stations: STATION_NAMES.id,
  backToTruck: 'Kembali ke truck',
  retry: 'Coba lagi',
  truckOrder: 'Pesanan',
  truckTablet: (app: string) => `Tablet · ${app}`,
  truckControls: 'WASD: jalan · mouse: melihat · E atau klik: pakai · Esc: lepas mouse',
  truckStart: 'Klik untuk melihat sekeliling',
  truckStartHint: 'WASD untuk berjalan, mouse untuk melihat. Bidik tablet lalu tekan E.',
  truckAnswer: 'Bidik tablet lalu tekan E',
  truckSoon: (thing: string) => `${thing}: bisa dipakai di pembaruan berikutnya.`,
  truckThings: {
    fridge: 'Kulkas & stok',
    tablet: 'Tablet',
    'menu-board': 'Papan menu',
    'recipe-shelf': 'Binder resep',
    'back-door': 'Pintu belakang',
  },
  truckServed: 'Benar! Pesanannya sudah siap.',
  truckServe: 'Serahkan pesanan',
  blocksAnswer: 'Query-mu',
  blocksTray: 'Blok yang tersedia',
  blocksEmpty: 'Ketuk blok di bawah untuk menyusun query-mu',
  blocksHelp: 'Ketuk blok yang sudah dipasang untuk melepasnya.',
  blocksClear: 'Kosongkan',
  blankLabel: (n, total) => `Bagian kosong ${n} dari ${total}`,
  fillHelp: 'Isi bagian yang kosong, lalu tekan Jalankan (atau Enter).',
  starters: 'Query awal',
  starterLoad: (n) => `Muat query ${n}`,
  starterHelp: 'Muat ke editor, ubah, lalu jalankan. Bagian ___ kamu isi sendiri.',
  pin: '📌 Sematkan ke catatan',
  pinned: '📌 Tersemat',
  notes: 'Catatan investigasi',
  notesEmpty: 'Belum ada yang disematkan. Jalankan query, lalu sematkan hasil yang penting.',
  pinLabel: (n, rows) => `📌 ${n} · ${rows} baris`,
  unpin: 'Lepas sematan',
  conclusions: 'Kesimpulan',
  conclusionsHelp: 'Jawab setiap pertanyaan dan pilih hasil 📌 yang membuktikannya.',
  answerPlaceholder: 'Jawabanmu',
  evidence: 'Bukti',
  chooseEvidence: 'Pilih sematan 📌…',
  check: 'Periksa',
  backedByData: 'Didukung data',
  soWhat: 'Jadi artinya?',
  soWhatRight: 'Tepat.',
  starsLabel: (n) => `${n} dari 3 bintang`,
  starsPerfect: 'Sempurna — tanpa petunjuk, tanpa salah!',
  starsTipHints: 'Selesaikan tanpa petunjuk untuk ★★. Main ulang kapan saja dari Jurnal.',
  starsTipRuns: 'Jawab benar pada percobaan pertama untuk ★★★.',
  starsTipConclusions: 'Jawab semua pertanyaan tanpa kesimpulan yang salah untuk ★★★.',
  starsBest: (n) => `Rekor terbaikmu tetap ${'★'.repeat(n)}.`,
  coins: 'Koin',
  streak: (n) => `${n} hari berturut-turut`,
  rushBest: (n) => `Rekor terbaikmu: ${n}`,
};

export const ui: Record<Lang, UiText> = { en, id };

const STORAGE_KEY = 'sql-valley.lang';

/** The player's language, remembered in this browser. */
export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'id' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });
  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice just won't be remembered.
    }
  };
  return [lang, setLang];
}
