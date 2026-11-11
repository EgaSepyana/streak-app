// Satu-satunya sumber daftar kebiasaan. Tambah/ubah di sini, frontend ngambil dari /api/state.
export const HABITS = [
  { k: "pmo", name: "No PMO", sub: "Bersih seharian", icon: "i-shield" },
  { k: "food", name: "Makan sehat", sub: "Tanpa junk food & gorengan", icon: "i-leaf" },
  { k: "move", name: "Gerak", sub: "1000 langkah / lari 2 km", icon: "i-run" },
  { k: "fast", name: "Intermittent fasting", sub: "Puasa sesuai target jam", icon: "i-clock" },
  { k: "read", name: "Reading", sub: "Baca min. 10 halaman", icon: "i-book" },
  { k: "write", name: "Writing", sub: "Nulis min. 100 kata", icon: "i-pen" },
];
export const HABIT_KEYS = HABITS.map(h => h.k);
export const TZ = "Asia/Jakarta";

export function todayKey(date = new Date()) {
  // en-CA ngasih format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
}
export function shift(key, n) {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const isDateKey = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
