/**
 * Feedback the player sees after running a query.
 *
 * The checker and database return *structured* feedback (what went wrong, with
 * the numbers/names involved). `formatFeedback` turns it into a sentence in the
 * player's language. SQL names (columns, values) are never translated.
 */

import type { CaseFeedback } from './cases';
import { STATION_NAMES, type StationId } from './stations';

export type Lang = 'en' | 'id';
export const LANGS: Lang[] = ['en', 'id'];

export type Feedback =
  /** Error straight from PostgreSQL — always English. */
  | { kind: 'sql-error'; message: string }
  /** Common beginner mistakes, recognised from the PostgreSQL error. */
  | { kind: 'syntax-error'; near: string | null }
  | { kind: 'unknown-column'; name: string }
  | { kind: 'unknown-table'; name: string }
  | { kind: 'empty-query' }
  | { kind: 'read-only' }
  | { kind: 'transaction' }
  /** SET, RESET or DO: not a question for the data. */
  | { kind: 'not-a-query' }
  /** The table exists, but this station's console can't see it (GAME_DESIGN.md §3). */
  | { kind: 'other-station'; table: string; station: StationId | null }
  /** The player stopped a query that was taking too long. */
  | { kind: 'stopped' }
  | { kind: 'missing-columns'; columns: string[] }
  | { kind: 'extra-columns'; columns: string[] }
  | { kind: 'column-count'; actual: number; expected: number }
  | { kind: 'column-name'; actual: string; expected: string }
  | { kind: 'row-count'; actual: number; expected: number }
  /** The query ran but matched nothing, while rows were expected. */
  | { kind: 'no-rows'; expected: number }
  | { kind: 'unexpected-row'; row: string }
  | { kind: 'check-columns'; actual: string[]; expected: string[] }
  | { kind: 'wrong-order' }
  /** The result is right, but the query doesn't end with a semicolon. */
  | { kind: 'missing-semicolon' };

const code = (names: string[]) => names.map((n) => `\`${n}\``).join(', ');

const en = (fb: Feedback): string => {
  const rows = (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`;
  const cols = (n: number) => `${n} ${n === 1 ? 'column' : 'columns'}`;
  switch (fb.kind) {
    case 'sql-error':
      return fb.message;
    case 'syntax-error':
      return fb.near
        ? `Something is off near \`${fb.near}\`. Check the order: SELECT columns FROM table WHERE condition ;`
        : 'The query stops too early — something is missing at the end.';
    case 'unknown-column':
      return `There is no column \`${fb.name}\`. Check the spelling in the table list. (Text values need single quotes, e.g. 'coffee'.)`;
    case 'unknown-table':
      return `There is no table \`${fb.name}\`. Check the spelling in the table list.`;
    case 'empty-query':
      return 'Your query is empty — build it first, then press Run.';
    case 'read-only':
      return 'This console is read-only: you can look at the data, but not change it.';
    case 'transaction':
      return 'Transaction commands (BEGIN, COMMIT, ROLLBACK…) are not needed here.';
    case 'not-a-query':
      return 'Only questions for the data here: start with SELECT (or WITH).';
    case 'other-station':
      return fb.station
        ? `This station can't see \`${fb.table}\` — it's at the ${STATION_NAMES.en[fb.station]}.`
        : `This station can't see \`${fb.table}\`.`;
    case 'stopped':
      return 'Query stopped. Try a smaller one — a WHERE or LIMIT helps.';
    case 'missing-columns':
      return fb.columns.length === 1
        ? `Column ${code(fb.columns)} is missing.`
        : `Columns ${code(fb.columns)} are missing.`;
    case 'extra-columns':
      return fb.columns.length === 1
        ? `Your result has an extra column: ${code(fb.columns)}.`
        : `Your result has extra columns: ${code(fb.columns)}.`;
    case 'column-count':
      return `Your result has ${cols(fb.actual)} — expected ${fb.expected}.`;
    case 'column-name':
      return `Column \`${fb.actual}\` should be named \`${fb.expected}\`.`;
    case 'row-count':
      return `Your result has ${rows(fb.actual)} — expected ${fb.expected}.`;
    case 'no-rows':
      return `Your query found no rows — expected ${fb.expected}. Check the values in your condition: text must match exactly, including capital letters.`;
    case 'unexpected-row':
      return `This row shouldn't be in the result: ${fb.row}`;
    case 'check-columns':
      return `Check your columns: expected ${code(fb.expected)} but got ${code(fb.actual)}.`;
    case 'wrong-order':
      return 'You have the right rows, but in the wrong order.';
    case 'missing-semicolon':
      return 'Your result is right — now end the query with a semicolon `;`.';
  }
};

const id = (fb: Feedback): string => {
  switch (fb.kind) {
    case 'sql-error':
      return fb.message;
    case 'syntax-error':
      return fb.near
        ? `Ada yang janggal di dekat \`${fb.near}\`. Cek urutannya: SELECT kolom FROM tabel WHERE syarat ;`
        : 'Query-nya berhenti terlalu cepat — ada yang kurang di bagian akhir.';
    case 'unknown-column':
      return `Tidak ada kolom \`${fb.name}\`. Cek ejaannya di daftar tabel. (Nilai teks perlu tanda kutip tunggal, mis. 'coffee'.)`;
    case 'unknown-table':
      return `Tidak ada tabel \`${fb.name}\`. Cek ejaannya di daftar tabel.`;
    case 'empty-query':
      return 'Query-mu masih kosong — susun dulu, lalu tekan Jalankan.';
    case 'read-only':
      return 'Konsol ini hanya untuk membaca: kamu bisa melihat data, tapi tidak bisa mengubahnya.';
    case 'transaction':
      return 'Perintah transaksi (BEGIN, COMMIT, ROLLBACK…) tidak diperlukan di sini.';
    case 'not-a-query':
      return 'Di sini hanya untuk bertanya ke data: mulai dengan SELECT (atau WITH).';
    case 'other-station':
      return fb.station
        ? `Stasiun ini tidak bisa melihat \`${fb.table}\` — tabel itu ada di ${STATION_NAMES.id[fb.station]}.`
        : `Stasiun ini tidak bisa melihat \`${fb.table}\`.`;
    case 'stopped':
      return 'Query dihentikan. Coba yang lebih kecil — WHERE atau LIMIT bisa membantu.';
    case 'missing-columns':
      return `Kolom ${code(fb.columns)} belum ada.`;
    case 'extra-columns':
      return `Hasilmu punya kolom berlebih: ${code(fb.columns)}.`;
    case 'column-count':
      return `Hasilmu punya ${fb.actual} kolom — seharusnya ${fb.expected}.`;
    case 'column-name':
      return `Kolom \`${fb.actual}\` seharusnya bernama \`${fb.expected}\`.`;
    case 'row-count':
      return `Hasilmu punya ${fb.actual} baris — seharusnya ${fb.expected}.`;
    case 'no-rows':
      return `Query-mu tidak menemukan baris apa pun — seharusnya ${fb.expected}. Cek nilai di syaratmu: teks harus sama persis, termasuk huruf besar-kecilnya.`;
    case 'unexpected-row':
      return `Baris ini seharusnya tidak ada di hasil: ${fb.row}`;
    case 'check-columns':
      return `Cek kolommu: seharusnya ${code(fb.expected)}, tapi yang ada ${code(fb.actual)}.`;
    case 'wrong-order':
      return 'Barisnya sudah benar, tapi urutannya salah.';
    case 'missing-semicolon':
      return 'Hasilnya sudah benar — sekarang akhiri query dengan titik koma `;`.';
  }
};

export function formatFeedback(fb: Feedback, lang: Lang): string {
  return lang === 'id' ? id(fb) : en(fb);
}

/** Mini Case feedback: why a conclusion isn't accepted yet. */
export function formatCaseFeedback(fb: CaseFeedback, lang: Lang): string {
  const isId = lang === 'id';
  switch (fb.kind) {
    case 'no-answer':
      return isId ? 'Isi jawabanmu dulu.' : 'Give your answer first.';
    case 'answer-wrong':
      return isId
        ? 'Data belum mendukung jawaban itu. Jalankan query lagi dan lihat hasilnya baik-baik.'
        : "The data doesn't support that answer. Run another query and look closely at the result.";
    case 'no-evidence':
      return isId
        ? 'Jawabannya benar — sekarang pilih hasil 📌 yang membuktikannya.'
        : "That's right — now pick a 📌 pinned result that proves it.";
    case 'evidence-missing-column':
      return isId
        ? `Hasil yang dipilih perlu kolom \`${fb.column}\` untuk membuktikan jawaban ini.`
        : `The pinned result needs a \`${fb.column}\` column to prove this answer.`;
    case 'evidence-missing-rows':
      return isId
        ? `Hasil yang dipilih belum menunjukkan semua buktinya (${fb.missing} baris penting belum ada).`
        : `The pinned result doesn't show all the evidence yet (${fb.missing} key ${fb.missing === 1 ? 'row is' : 'rows are'} missing).`;
    case 'evidence-extra-rows':
      return isId
        ? `Hasil yang dipilih punya ${fb.actual} baris — buktinya seharusnya tepat ${fb.expected}. Saring lagi dengan WHERE.`
        : `The pinned result has ${fb.actual} rows — the evidence should be exactly ${fb.expected}. Filter it with WHERE.`;
    case 'evidence-too-broad':
      return isId
        ? `Hasil yang dipilih terlalu luas (${fb.actual} baris). Saring sampai yang penting saja terlihat (maks. ${fb.max}).`
        : `The pinned result is too broad (${fb.actual} rows). Filter it down to what matters (at most ${fb.max}).`;
  }
}
