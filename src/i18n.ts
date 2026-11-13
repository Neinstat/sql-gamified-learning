import { useState } from 'react';
import type { Lang } from './sql-core/feedback';
import type { CharacterId } from './sql-core/levels';
import type { StationId } from './sql-core/stations';

export type { Lang };

/** UI text in every language. Level text lives in sql-core/levels. */
const en = {
  loading: "Opening Grandma's records…",
  loadError: 'Could not open the café records:',
  tables: 'Tables',
  run: 'Run',
  running: 'Running…',
  shortcut: 'or press Ctrl/⌘ + Enter',
  rows: (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`,
  chapter: (n: number) => `Chapter ${n}`,
  task: 'Your task',
  showLesson: 'Show the lesson again',
  hideLesson: 'Hide the lesson',
  correct: 'Correct!',
  allDone: "That's all for now — more chapters are coming soon!",
  language: 'Language',
  hintButton: (used: number, total: number) => (used === 0 ? 'Need a hint?' : `Another hint (${used}/${total})`),
  hintTitle: (n: number) => `Hint ${n}`,
  levels: 'Levels',
  startOver: 'Start over',
  loadingWorld: 'Opening the café…',
  dialogueNext: 'Next',
  dialogueClose: 'Close',
  dialogueHint: 'Click, or press Space / E',
  stations: { 'menu-board': 'Menu board', 'cash-register': 'Cash register' } satisfies Record<StationId, string>,
  stationClosed: "The register's records are still in a shoebox. Grandma will sort them out with you later.",
  stationNothing: 'Nothing to look up here right now. Check your task first.',
  stationTalkFirst: (name: string) => `${name} has a request for you first.`,
  questTalk: (name: string) => `Talk to ${name}`,
  questSolve: (station: string) => `At the ${station.toLowerCase()}:`,
  questReport: (name: string) => `Go tell ${name} what you found`,
  questRemind: (station: string) => `Have a look at the ${station.toLowerCase()}, then come back and tell me.`,
  solvedGoReport: (name: string) => `Nice work! Go tell ${name}.`,
  backToCafe: 'Back to the café',
  retry: 'Try again',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  loadingRecords: 'Loading records…',
  journal: 'Journal',
  journalHint: 'Pick a finished level to play it again.',
  gotIt: 'Got it',
  npcIdle: {
    grandma: "Take your time, dear. I'll be right here when you're ready.",
    barista: 'One sec — the milk is about to boil over!',
    supplier: "Deliveries are on schedule. Don't worry about a thing.",
    regular: 'Best coffee in the valley, I tell everyone.',
  } satisfies Record<CharacterId, string>,
  confirmStartOver: 'Erase your progress and start again from the first level?',
  newChapter: 'New chapter',
  blocksAnswer: 'Your query',
  blocksTray: 'Available blocks',
  blocksEmpty: 'Tap the blocks below to build your query',
  blocksHelp: 'Tap a placed block to remove it.',
  blocksClear: 'Clear',
  blankLabel: (n: number, total: number) => `Blank ${n} of ${total}`,
  fillHelp: 'Fill in the blanks, then press Run (or Enter).',
  characters: { grandma: 'Grandma', barista: 'Barista', supplier: 'Supplier', regular: 'Regular' } satisfies Record<
    CharacterId,
    string
  >,
};

export type UiText = typeof en;

const id: UiText = {
  loading: 'Membuka catatan Nenek…',
  loadError: 'Catatan kafe tidak bisa dibuka:',
  tables: 'Tabel',
  run: 'Jalankan',
  running: 'Menjalankan…',
  shortcut: 'atau tekan Ctrl/⌘ + Enter',
  rows: (n) => `${n} baris`,
  chapter: (n) => `Chapter ${n}`,
  task: 'Tugasmu',
  showLesson: 'Lihat materi lagi',
  hideLesson: 'Sembunyikan materi',
  correct: 'Benar!',
  allDone: 'Sudah semua untuk sekarang — chapter berikutnya segera hadir!',
  language: 'Bahasa',
  hintButton: (used, total) => (used === 0 ? 'Butuh petunjuk?' : `Petunjuk lagi (${used}/${total})`),
  hintTitle: (n) => `Petunjuk ${n}`,
  levels: 'Level',
  startOver: 'Mulai dari awal',
  loadingWorld: 'Membuka kafe…',
  dialogueNext: 'Lanjut',
  dialogueClose: 'Tutup',
  dialogueHint: 'Klik, atau tekan Spasi / E',
  stations: { 'menu-board': 'Papan menu', 'cash-register': 'Mesin kasir' },
  stationClosed: 'Catatan kasir masih tersimpan di kotak sepatu. Nenek akan merapikannya bersamamu nanti.',
  stationNothing: 'Belum ada yang perlu dicari di sini. Cek dulu tugasmu.',
  stationTalkFirst: (name) => `${name} punya permintaan untukmu dulu.`,
  questTalk: (name) => `Bicara dengan ${name}`,
  questSolve: (station) => `Di ${station.toLowerCase()}:`,
  questReport: (name) => `Laporkan hasilnya ke ${name}`,
  questRemind: (station) => `Coba lihat di ${station.toLowerCase()}, lalu kembali dan ceritakan hasilnya, ya.`,
  solvedGoReport: (name) => `Kerja bagus! Sampaikan ke ${name}.`,
  backToCafe: 'Kembali ke kafe',
  retry: 'Coba lagi',
  zoomIn: 'Perbesar',
  zoomOut: 'Perkecil',
  loadingRecords: 'Memuat catatan…',
  journal: 'Jurnal',
  journalHint: 'Pilih level yang sudah selesai untuk memainkannya lagi.',
  gotIt: 'Mengerti',
  npcIdle: {
    grandma: 'Santai saja, Nak. Nenek ada di sini kalau kamu sudah siap.',
    barista: 'Sebentar — susunya hampir meluap!',
    supplier: 'Pengiriman sesuai jadwal. Tidak perlu khawatir.',
    regular: 'Kopi terenak di lembah ini, kata saya ke semua orang.',
  },
  confirmStartOver: 'Hapus progresmu dan mulai lagi dari level pertama?',
  newChapter: 'Chapter baru',
  blocksAnswer: 'Query-mu',
  blocksTray: 'Blok yang tersedia',
  blocksEmpty: 'Ketuk blok di bawah untuk menyusun query-mu',
  blocksHelp: 'Ketuk blok yang sudah dipasang untuk melepasnya.',
  blocksClear: 'Kosongkan',
  blankLabel: (n, total) => `Bagian kosong ${n} dari ${total}`,
  fillHelp: 'Isi bagian yang kosong, lalu tekan Jalankan (atau Enter).',
  characters: { grandma: 'Nenek', barista: 'Barista', supplier: 'Pemasok', regular: 'Pelanggan tetap' },
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
