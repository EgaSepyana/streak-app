import { json, isCronAuthed } from "../lib/http.js";
import { migrate } from "../lib/db.js";
import { tg } from "../lib/telegram.js";

// Jalanin sekali setelah deploy: https://<app>/api/setup?key=<CRON_SECRET>
// Bikin tabel di Neon + daftarin webhook & command bot Telegram. Aman dijalanin berkali-kali.
export async function GET(req) {
  if (!isCronAuthed(req)) return json({ error: "unauthorized" }, 401);
  const report = {};

  await migrate();
  report.database = "tabel siap";

  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  if (!process.env.TELEGRAM_BOT_TOKEN) report.telegram = "dilewat: TELEGRAM_BOT_TOKEN belum di-set";
  else if (!appUrl.startsWith("https://")) report.telegram = "dilewat: APP_URL harus https://...";
  else if (!process.env.TELEGRAM_WEBHOOK_SECRET) report.telegram = "dilewat: TELEGRAM_WEBHOOK_SECRET belum di-set";
  else {
    await tg("setWebhook", {
      url: `${appUrl}/api/telegram`,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    await tg("setMyCommands", {
      commands: [
        { command: "today", description: "Status streak & centang hari ini" },
        { command: "start", description: "Mulai / cek chat ID" },
      ],
    });
    report.telegram = `webhook → ${appUrl}/api/telegram`;
  }
  report.chatId = process.env.TELEGRAM_CHAT_ID ? "ok" : "belum di-set (chat /start ke bot buat dapetin ID-nya)";
  return json({ ok: true, ...report });
}
