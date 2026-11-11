import { json, isAuthed } from "../lib/http.js";
import { loadDays, loadSettings } from "../lib/db.js";
import { HABITS } from "../lib/habits.js";

export async function GET(req) {
  if (!isAuthed(req)) return json({ error: "unauthorized" }, 401);
  const [days, settings] = await Promise.all([loadDays(), loadSettings()]);
  return json({ habits: HABITS, days, settings });
}
