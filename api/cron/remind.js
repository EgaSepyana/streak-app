import { json, isCronAuthed } from "../../lib/http.js";
import { sendStatus } from "../../lib/telegram.js";
import { TZ } from "../../lib/habits.js";

// GET /api/cron/remind?slot=morning|evening
// Auth: header "Authorization: Bearer <CRON_SECRET>" (Vercel Cron ngirim ini otomatis) atau ?key=<CRON_SECRET>
export async function GET(req) {
  if (!isCronAuthed(req)) return json({ error: "unauthorized" }, 401);
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return json({ error: "TELEGRAM_CHAT_ID belum di-set" }, 500);

  let slot = new URL(req.url).searchParams.get("slot");
  if (slot !== "morning" && slot !== "evening") {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
    slot = hour < 12 ? "morning" : "evening";
  }
  await sendStatus(chatId, slot);
  return json({ ok: true, slot });
}
