/**
 * Feedback the player sees after running a query.
 *
 * The checker and database return *structured* feedback (what went wrong, with
 * the numbers/names involved). `formatFeedback` turns it into a sentence in the
 * player's language. SQL names (columns, values) are never translated.
 */

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
  | { kind: 'missing-columns'; columns: string[] }
  | { kind: 'extra-columns'; columns: string[] }
  | { kind: 'column-count'; actual: number; expected: number }
  | { kind: 'column-name'; actual: string; expected: string }
  | { kind: 'row-count'; actual: number; expected: number }
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
      return 'Type a query first, e.g. SELECT * FROM menu_items;';
    case 'read-only':
      return 'This console is read-only: you can look at the data, but not change it.';
    case 'transaction':
      return 'Transaction commands (BEGIN, COMMIT, ROLLBACK…) are not needed here.';
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
      return 'Ketik query dulu, mis. SELECT * FROM menu_items;';
    case 'read-only':
      return 'Konsol ini hanya untuk membaca: kamu bisa melihat data, tapi tidak bisa mengubahnya.';
    case 'transaction':
      return 'Perintah transaksi (BEGIN, COMMIT, ROLLBACK…) tidak diperlukan di sini.';
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
