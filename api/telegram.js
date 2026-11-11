import { json, safeEqual } from "../lib/http.js";
import { tg, buildStatus, sendStatus } from "../lib/telegram.js";
import { loadDays, setHabit } from "../lib/db.js";
import { HABITS, HABIT_KEYS, isDateKey, todayKey, shift } from "../lib/habits.js";

// Webhook Telegram. Selalu balas 200 biar Telegram nggak ngirim ulang update yang sama.
export async function POST(req) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  if (!secret || !safeEqual(req.headers.get("x-telegram-bot-api-secret-token") || "", secret)) {
    return json({ error: "unauthorized" }, 401);
  }
  let update;
  try { update = await req.json(); } catch { return json({ ok: true }); }

  try {
    if (update.message) await onMessage(update.message);
    else if (update.callback_query) await onCallback(update.callback_query);
  } catch (e) {
    console.error(e);
  }
  return json({ ok: true });
}

const allowed = chatId => String(chatId) === String(process.env.TELEGRAM_CHAT_ID || "");

async function onMessage(msg) {
  const chatId = msg.chat.id;
  const cmd = (msg.text || "").trim().split(/[\s@]/)[0].toLowerCase();

  if (!allowed(chatId)) {
    // Biar gampang setup: kasih tau chat ID-nya, tapi nggak kasih akses apa pun.
    if (cmd === "/start") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: `Chat ID lo: ${chatId}\nMasukin ke env TELEGRAM_CHAT_ID di Vercel, terus redeploy.`,
      });
    }
    return;
  }

  if (cmd === "/start" || cmd === "/today" || cmd === "/status") {
    await sendStatus(chatId, "now");
  } else {
    await tg("sendMessage", { chat_id: chatId, text: "Ketik /today buat liat status dan centang dari sini." });
  }
}

async function onCallback(cb) {
  const chatId = cb.message?.chat?.id;
  const [kind, habit, date] = String(cb.data || "").split(":");
  const today = todayKey();

  if (!allowed(chatId) || kind !== "t" || !HABIT_KEYS.includes(habit) || !isDateKey(date)) {
    return tg("answerCallbackQuery", { callback_query_id: cb.id });
  }
  if (date > today || date < shift(today, -7)) {
    return tg("answerCallbackQuery", { callback_query_id: cb.id, text: "Pesan ini udah kelamaan. Ketik /today.", show_alert: true });
  }

  const days = await loadDays(date);
  const next = !(days[date] && days[date][habit]);
  await setHabit(date, habit, next);

  const name = HABITS.find(h => h.k === habit).name;
  await tg("answerCallbackQuery", { callback_query_id: cb.id, text: next ? `${name} dicentang` : `${name} dibatalin` });

  const status = await buildStatus("now", date);
  try {
    await tg("editMessageText", { chat_id: chatId, message_id: cb.message.message_id, ...status });
  } catch (e) {
    if (!/not modified/i.test(e.message)) throw e;
  }
}
