/**
 * Skill Check — Bahasa Indonesia (only the prompts; SQL stays English).
 */
export const skillCheckId: Record<string, string> = {
  'sc0-1': 'Tampilkan semua kolom dari setiap pelanggan.',
  'sc0-2': 'Tampilkan name dan category dari setiap menu.',
  'sc1-1': 'Tampilkan name dari setiap dessert yang harganya lebih dari $4.',
  'sc1-2': 'Tampilkan name dari setiap menu yang tidak punya description.',
  'sc2-1': 'Tampilkan name dan price dari 3 minuman kopi termahal, dari yang termahal.',
  'sc2-2': 'Tampilkan name dan margin (price − cost) setiap sandwich, dengan kolom margin bernama margin.',
  'sc3-1': 'Tampilkan total item terjual (jumlah quantity) lewat channel takeaway.',
  'sc3-2': 'Tampilkan setiap channel dengan jumlah order-nya (setiap order dihitung sekali), bernama orders.',
  'sc4-1': 'Tampilkan setiap category menu dengan revenue-nya (quantity × unit_price), bernama revenue.',
  'sc4-2': 'Tampilkan name setiap pelanggan yang pernah memesan lewat channel delivery, masing-masing sekali.',
};
