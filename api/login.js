import { json, safeEqual, sessionCookie } from "../lib/http.js";

// POST { password }
export async function POST(req) {
  if (!process.env.APP_PASSWORD) return json({ error: "APP_PASSWORD belum di-set di Vercel" }, 500);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Body harus JSON" }, 400); }
  if (!safeEqual(body?.password || "", process.env.APP_PASSWORD)) {
    await new Promise(r => setTimeout(r, 600)); // pelan-pelan buat nebak-nebak
    return json({ error: "Password salah" }, 401);
  }
  return json({ ok: true }, 200, { "set-cookie": sessionCookie() });
}
