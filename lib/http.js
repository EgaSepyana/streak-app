import { createHmac, timingSafeEqual } from "node:crypto";

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

const COOKIE = "streak_sess";
const token = () => createHmac("sha256", process.env.APP_PASSWORD || "").update("streak-v1").digest("hex");

export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isAuthed(req) {
  if (!process.env.APP_PASSWORD) return false;
  const m = (req.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]+)`));
  return !!m && safeEqual(m[1], token());
}

export function sessionCookie() {
  return `${COOKIE}=${token()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
}

// Buat endpoint cron/setup: header "Authorization: Bearer <CRON_SECRET>" atau ?key=<CRON_SECRET>
export function isCronAuthed(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const key = new URL(req.url).searchParams.get("key") || "";
  return safeEqual(bearer, secret) || safeEqual(key, secret);
}
