import { todayKey, shift } from "./habits.js";
import { loadDays, loadSettings } from "./db.js";
import { makeStats } from "./streak.js";

const api = async (method, body) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN belum di-set");
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
  return data.result;
};
export const tg = api;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const appUrl = () => (process.env.APP_URL || "").replace(/\/$/, "");

// slot: "morning" | "evening" | "now"
export async function buildStatus(slot = "now", today = todayKey()) {
  const [days, settings] = await Promise.all([loadDays(shift(today, -400)), loadSettings()]);
  const s = makeStats(days, today);
  const left = s.habits.filter(h => !h.today);

  const head = {
    morning: `<b>Pagi, Ega.</b> Hari baru, streak lanjut.`,
    evening: left.length
      ? `<b>Udah jam 5.</b> Masih ada ${left.length} yang belum dicentang.`
      : `<b>Udah jam 5.</b> Semua udah beres hari ini. Mantap.`,
    now: today === todayKey() ? `<b>Status hari ini</b>` : `<b>Status ${today}</b>`,
  }[slot];

  const lines = s.habits.map(h =>
    `${h.today ? "✅" : "▫️"} ${esc(h.name)} · <b>${h.streak}</b> hari`
  );

  let fast = "";
  if (settings.fastStart) {
    const ms = Date.now() - settings.fastStart;
    const hh = Math.floor(ms / 3600000), mm = Math.floor(ms / 60000) % 60;
    fast = `\n⏱ Lagi puasa: ${hh}j ${mm}m dari target ${settings.fastTarget} jam`;
  }

  const text = [
    head,
    `🔥 Hari sempurna beruntun: <b>${s.perfect} hari</b> (${s.doneToday}/${s.habits.length} hari ini)`,
    "",
    ...lines,
    fast,
    "",
    `Isi di sini: ${esc(appUrl() || "(APP_URL belum di-set)")}`,
  ].join("\n").replace(/\n{3,}/g, "\n\n");

  return { text, reply_markup: keyboard(s.habits, today), parse_mode: "HTML", link_preview_options: { is_disabled: true } };
}

function keyboard(habits, day) {
  const rows = [];
  for (let i = 0; i < habits.length; i += 2) {
    rows.push(habits.slice(i, i + 2).map(h => ({
      text: `${h.today ? "✅" : "▫️"} ${h.name}`,
      callback_data: `t:${h.k}:${day}`,
    })));
  }
  if (appUrl().startsWith("https://")) rows.push([{ text: "Buka app", url: appUrl() }]);
  return { inline_keyboard: rows };
}

export async function sendStatus(chatId, slot) {
  return api("sendMessage", { chat_id: chatId, ...(await buildStatus(slot)) });
}
