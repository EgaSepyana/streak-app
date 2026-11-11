import { json, isAuthed } from "../lib/http.js";
import { setHabit } from "../lib/db.js";
import { HABIT_KEYS, isDateKey, todayKey } from "../lib/habits.js";

// POST { date: "YYYY-MM-DD", habit: "pmo", done: true }
export async function POST(req) {
  if (!isAuthed(req)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Body harus JSON" }, 400); }
  const { date, habit, done } = body || {};
  if (!isDateKey(date) || date > todayKey()) return json({ error: "Tanggal nggak valid" }, 400);
  if (!HABIT_KEYS.includes(habit)) return json({ error: "Kebiasaan nggak dikenal" }, 400);
  await setHabit(date, habit, !!done);
  return json({ ok: true });
}
