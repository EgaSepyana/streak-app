import { json, isAuthed } from "../lib/http.js";
import { saveSettings } from "../lib/db.js";

// POST { fastTarget: 16, fastStart: 1731200000000 | null }
export async function POST(req) {
  if (!isAuthed(req)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Body harus JSON" }, 400); }
  const fastTarget = Number(body?.fastTarget);
  const fastStart = body?.fastStart == null ? null : Number(body.fastStart);
  if (!Number.isInteger(fastTarget) || fastTarget < 10 || fastTarget > 72) return json({ error: "Target puasa 10–72 jam" }, 400);
  if (fastStart !== null && (!Number.isFinite(fastStart) || fastStart > Date.now() + 60000)) return json({ error: "Waktu mulai nggak valid" }, 400);
  await saveSettings({ fastTarget, fastStart });
  return json({ ok: true });
}
