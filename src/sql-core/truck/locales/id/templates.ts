import { money, type Params, type TemplateText } from '../../templates';

/**
 * Indonesian text for the order templates (keyed by template id). Values in the data and SQL
 * (category names, column names, patterns) stay in English; customers may still say the
 * Indonesian word in their own lines.
 */
const KATEGORI: Record<string, string> = {
  coffee: 'kopi',
  tea: 'teh',
  pastry: 'pastri',
  sandwich: 'roti lapis',
  dessert: 'makanan penutup',
};
const BAHAN: Record<string, string> = {
  milk: 'susu',
  eggs: 'telur',
  butter: 'mentega',
  sugar: 'gula',
  'coffee beans': 'biji kopi',
  flour: 'tepung',
};
const kat = (p: string | number) => KATEGORI[String(p)] ?? String(p);
const bahan = (p: string | number) => BAHAN[String(p)] ?? String(p);
const kapital = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

export const TEMPLATES_ID: Record<string, TemplateText> = {
  'price-under': {
    title: (p) => `Di Bawah ${money(p.max)}`,
    lines: [
      (p) => `Uangku cuma ${money(p.max)}. Apa yang bisa kubeli dengan harga kurang dari itu?`,
      (p) => `Gajian masih seminggu lagi. Ada yang di bawah ${money(p.max)}?`,
      (p) => `Ada apa saja yang harganya kurang dari ${money(p.max)}? Nama dan harganya, ya.`,
    ],
    task: (p) => `Tampilkan name dan price dari setiap menu yang harganya di bawah ${money(p.max)}.`,
    hints: [
      () => 'Kamu membandingkan kolom price dengan sebuah angka.',
      (p) => `"Di bawah ${money(p.max)}" artinya kurang dari — menu yang harganya tepat ${money(p.max)} tidak ikut.`,
      (p) => `… WHERE price < ${p.max};`,
    ],
    success: () => 'Pas dengan isi dompetku. Makasih!',
  },
  'price-at-least': {
    title: (p) => `${money(p.min)} ke Atas`,
    lines: [
      (p) => `Hari ini ulang tahunku. Tunjukkan semua yang harganya ${money(p.min)} atau lebih!`,
      (p) => `Aku lapar sekali. Ada apa saja yang harganya ${money(p.min)} ke atas?`,
    ],
    task: (p) => `Tampilkan name dan price dari setiap menu yang harganya ${money(p.min)} atau lebih.`,
    hints: [
      () => 'Kamu membandingkan kolom price dengan sebuah angka.',
      (p) => `"Atau lebih" berarti ${money(p.min)} juga ikut: lebih besar atau sama dengan.`,
      (p) => `… WHERE price >= ${p.min};`,
    ],
    success: () => 'Nah, ini baru namanya traktiran.',
  },
  category: {
    title: (p) => `Ada ${kapital(kat(p.category))} Apa?`,
    lines: [
      (p) => `Ada ${kat(p.category)} apa saja, dan berapa harganya?`,
      (p) => `Lagi pengin ${kat(p.category)}. Tunjukkan semua yang ada, sama harganya.`,
    ],
    task: (p) => `Tampilkan name dan price dari setiap menu di kategori ${p.category}.`,
    hints: [
      () => 'Bandingkan kolom category dengan sebuah kata.',
      (p) => `${p.category} adalah teks, jadi ditulis di antara tanda kutip satu.`,
      (p) => `… WHERE category = '${p.category}';`,
    ],
    success: () => 'Susah milihnya… Aku ambil satu.',
  },
  available: {
    title: (p) => `${kapital(kat(p.category))} yang Tersedia`,
    lines: [
      (p) => `${kapital(kat(p.category))} mana yang benar-benar bisa dipesan hari ini? Bukan yang sedang habis.`,
      (p) => `Jangan kasih tahu ${kat(p.category)} yang tidak bisa dibuat. Mana yang tersedia hari ini?`,
    ],
    task: (p) => `Tampilkan name dari setiap menu ${p.category} yang tersedia.`,
    hints: [
      () => 'Dua syarat harus benar sekaligus.',
      () => 'Kata apa yang menggabungkan dua syarat sehingga keduanya harus terpenuhi?',
      (p) => `… WHERE category = '${p.category}' AND is_available = TRUE;`,
    ],
    success: () => 'Bagus, hari ini tidak ada yang kecewa.',
  },
  'category-under': {
    title: (p) => `${kapital(kat(p.category))} Murah`,
    lines: [
      (p) => `Mau ${kat(p.category)}, tapi di bawah ${money(p.max)}. Ada pilihan apa?`,
      (p) => `Ada ${kat(p.category)} yang kurang dari ${money(p.max)}? Sekalian harganya, ya.`,
    ],
    task: (p) => `Tampilkan name dan price dari setiap menu ${p.category} yang harganya di bawah ${money(p.max)}.`,
    hints: [
      () => 'Dua syarat: kategorinya, dan harganya. Keduanya harus terpenuhi.',
      () => 'Kata apa yang menggabungkan dua syarat sehingga keduanya harus benar?',
      (p) => `… WHERE category = '${p.category}' AND price < ${p.max};`,
    ],
    success: () => 'Sempurna. Murah dan enak.',
  },
  'two-categories': {
    title: (p: Params) => `${kapital(kat(p.a))} dan ${kat(p.b)}`,
    lines: [
      (p) => `Aku sekalian beli untuk pasanganku. Tunjukkan ${kat(p.a)} dan ${kat(p.b)} yang ada.`,
      (p) => `${kapital(kat(p.a))} dan ${kat(p.b)} saja, ya — ada apa saja? Sama kategorinya, biar aku bisa membedakan.`,
    ],
    task: (p) => `Tampilkan name dan category dari setiap menu di kategori ${p.a} atau ${p.b}.`,
    hints: [
      () => 'Kategorinya bisa salah satu dari dua nilai.',
      () => 'Kata apa yang mencocokkan sebuah nilai dengan daftar di dalam kurung?',
      (p) => `… WHERE category IN ('${p.a}', '${p.b}');`,
    ],
    success: () => 'Masing-masing satu, deh!',
  },
  'name-like': {
    title: (p) => `Yang Ada "${p.text}"-nya`,
    lines: [
      (p) => `Ada menu yang namanya mengandung "${p.text}"? Yang mana saja boleh.`,
      (p) => `Aku cuma ingat kata "${p.text}". Menu mana saja yang namanya ada kata itu?`,
    ],
    task: (p) => `Tampilkan name dari setiap menu yang namanya mengandung ${p.text}.`,
    hints: [
      () => 'Kamu tidak mencocokkan nama utuh, hanya sebagiannya.',
      () => 'Kata apa yang membandingkan teks dengan sebuah pola? % berarti teks apa saja.',
      (p) => `… WHERE name LIKE '%${p.text}%';`,
    ],
    success: () => 'Itu dia! Itu yang kumaksud.',
  },
  'description-like': {
    title: (p) => `${kapital(bahanAtauTeks(p.text))} Tersembunyi`,
    lines: [
      (p) => `Aku suka sekali ${bahanAtauTeks(p.text)}. Menu mana yang ada ${bahanAtauTeks(p.text)}nya? Baca deskripsinya — namanya tidak selalu memberi tahu.`,
      (p) => `Ada ${bahanAtauTeks(p.text)} di salah satu menu? Cek apa kata deskripsi setiap menu.`,
    ],
    task: (p) => `Tampilkan name dari setiap menu yang deskripsinya menyebut ${p.text}.`,
    hints: [
      () => 'Nama saja tidak cukup: cari di kolom yang menjelaskan setiap menu.',
      (p) => `Pola dengan % di kedua sisi menemukan ${p.text} di mana saja dalam teks. Pola ditulis di antara tanda kutip.`,
      (p) => `… WHERE description LIKE '%${p.text}%';`,
    ],
    success: () => 'Wah, aku baru tahu. Aku coba yang itu.',
  },
  'missing-value': {
    title: (p) => `Tanpa ${p.column}`,
    lines: [
      (p) =>
        p.column === 'description'
          ? 'Aku punya alergi. Menu mana yang belum punya deskripsi? Aku tidak mau ambil risiko.'
          : p.column === 'category'
            ? 'Menumu agak berantakan. Menu mana yang bahkan tidak punya kategori?'
            : 'Ada menu di papanmu yang tidak ada harganya. Menu mana saja yang tidak punya harga sama sekali?',
    ],
    task: (p) => `Tampilkan name dari setiap menu yang ${p.column}-nya kosong.`,
    hints: [
      () => 'Nilai yang kosong adalah NULL: bukan nol, bukan teks kosong.',
      () => '= NULL tidak pernah cocok dengan apa pun. Ada cara khusus untuk memeriksa NULL.',
      (p) => `… WHERE ${p.column} IS NULL;`,
    ],
    success: () => 'Makasih. Harusnya ada yang mengisi itu!',
  },
  'supplier-now': {
    title: (p) => `Siapa yang Mengantar ${kapital(bahan(p.product))}?`,
    lines: [
      (p) =>
        p.product === 'milk'
          ? 'Susunya akhir-akhir ini rasanya beda. Siapa yang mengantarnya sekarang, dan kapan?'
          : `Siapa pemasok ${bahan(p.product)} kalian sekarang, dan jam berapa datangnya?`,
    ],
    task: (p) => `Tampilkan name dan delivery_time pemasok ${p.product} yang dipakai sekarang (tanggal until-nya kosong).`,
    hints: [
      () => 'Pemasok yang masih dipakai belum punya tanggal berakhir.',
      () => 'Kolom mana yang menyimpan sampai kapan sebuah pemasok dipakai?',
      (p) => `… WHERE product = '${p.product}' AND until IS NULL;`,
    ],
    success: (p) =>
      p.product === 'milk' ? 'Highland Dairy, jam dua belas siang? Pantas tadi pagi tidak ada susu.' : 'Bagus, jadi tahu harus berterima kasih ke siapa.',
  },
  'recipe-ingredient': {
    title: (p) => `Berapa Banyak ${kapital(bahan(p.ingredient))}?`,
    lines: [
      (p) => `Kata dokter aku harus kurangi ${bahan(p.ingredient)}. Berapa banyak ${bahan(p.ingredient)} di setiap menumu?`,
      (p) => `Aku sedang menghitung ${bahan(p.ingredient)} yang kumakan. Resep mana yang memakainya, dan berapa banyak?`,
    ],
    task: (p) => `Tampilkan item_id dan amount dari setiap baris resep yang memakai ${p.ingredient}.`,
    hints: [
      () => 'Setiap baris recipes adalah satu bahan dari satu menu.',
      () => 'Nilai teks ditulis di antara tanda kutip satu.',
      (p) => `… WHERE ingredient = '${p.ingredient}';`,
    ],
    success: () => 'Berguna sekali. Aku pilih yang paling sedikit.',
  },
};

function bahanAtauTeks(text: string | number): string {
  const kata: Record<string, string> = { chocolate: 'cokelat', milk: 'susu', cinnamon: 'kayu manis' };
  return kata[String(text)] ?? String(text);
}
