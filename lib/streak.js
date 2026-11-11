import { HABITS, todayKey, shift } from "./habits.js";

// days: { "YYYY-MM-DD": { pmo: true, ... } }
export function makeStats(days, today = todayKey()) {
  const done = (k, h) => !!(days[k] && days[k][h]);
  const perfect = k => HABITS.every(h => done(k, h.k));

  // Hari ini belum lewat, jadi kalau hari ini belum dicentang streak dihitung dari kemarin.
  function current(test) {
    let k = today, n = 0;
    if (!test(k)) k = shift(k, -1);
    while (test(k)) { n++; k = shift(k, -1); }
    return n;
  }

  return {
    perfect: current(perfect),
    perfectToday: perfect(today),
    doneToday: HABITS.filter(h => done(today, h.k)).length,
    habits: HABITS.map(h => ({ ...h, streak: current(k => done(k, h.k)), today: done(today, h.k) })),
  };
}
