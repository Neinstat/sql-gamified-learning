import { useState } from 'react';
import type { Lang } from './sql-core/feedback';
import type { CharacterId } from './sql-core/levels';

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
  level: (n: number, total: number) => `Level ${n} of ${total}`,
  start: "Let's do it",
  task: 'Your task',
  showLesson: 'Show the lesson again',
  hideLesson: 'Hide the lesson',
  correct: 'Correct!',
  next: 'Next level',
  allDone: "That's all for now — more chapters are coming soon!",
  language: 'Language',
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
  level: (n, total) => `Level ${n} dari ${total}`,
  start: 'Ayo mulai',
  task: 'Tugasmu',
  showLesson: 'Lihat materi lagi',
  hideLesson: 'Sembunyikan materi',
  correct: 'Benar!',
  next: 'Level berikutnya',
  allDone: 'Sudah semua untuk sekarang — chapter berikutnya segera hadir!',
  language: 'Bahasa',
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
