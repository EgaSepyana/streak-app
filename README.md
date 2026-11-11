# Streak Harian

Tracker kebiasaan harian: No PMO, makan sehat, gerak, intermittent fasting, reading, writing.
Tap buat centang, streak dihitung otomatis, reminder Telegram jam 07.00 & 17.00 WIB (bisa centang langsung dari Telegram).

**Stack:** HTML statis + Vercel Functions (Node 20+) + Neon Postgres + Telegram Bot API (webhook).

```
public/index.html        UI (satu file)
api/state.js             GET  semua data
api/day.js               POST centang/batal satu kebiasaan
api/settings.js          POST target & timer puasa
api/login.js             POST password -> cookie 1 tahun
api/telegram.js          POST webhook bot (/today + tombol centang)
api/cron/remind.js       GET  kirim reminder (?slot=morning|evening)
api/setup.js             GET  bikin tabel + daftarin webhook (sekali jalan)
lib/habits.js            daftar kebiasaan  <- edit di sini kalau mau nambah/ubah
```

## Deploy (±15 menit)

### 1. Neon
1. Bikin project di https://console.neon.tech (region **AWS Singapore / ap-southeast-1**, paling deket ke Bandung).
2. **Connect** → pilih **Pooled connection** → copy connection string → ini `DATABASE_URL`.
   Tabel dibikin otomatis di langkah 5.

### 2. Bot Telegram
1. Chat **@BotFather** → `/newbot` → kasih nama → copy token → ini `TELEGRAM_BOT_TOKEN`.
2. `TELEGRAM_CHAT_ID` diisi nanti (langkah 6).

### 3. Push ke GitHub, import ke Vercel
```bash
git init && git add . && git commit -m "streak harian"
gh repo create streak-harian --private --source=. --push
```
Vercel → **Add New → Project** → pilih repo. Framework Preset: **Other**. Biarin build command kosong.
Set **Function Region** ke `sin1` (Singapore) di Settings → Functions, biar deket sama Neon.

### 4. Environment variables (Vercel → Settings → Environment Variables)
Lihat `.env.example`. Isi semua kecuali `TELEGRAM_CHAT_ID`:

| Nama | Isi |
|---|---|
| `DATABASE_URL` | dari Neon |
| `APP_PASSWORD` | password login web |
| `APP_URL` | `https://<project>.vercel.app` (tanpa `/` di belakang) |
| `TELEGRAM_BOT_TOKEN` | dari BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | string acak (huruf/angka/`_`/`-`) |
| `CRON_SECRET` | string acak lain |

Bikin string acak: `openssl rand -hex 24`

Redeploy setelah ngisi env.

### 5. Setup sekali
Buka di browser:
```
https://<project>.vercel.app/api/setup?key=<CRON_SECRET>
```
Harus keluar `"database":"tabel siap"` dan `"telegram":"webhook → ..."`.

### 6. Chat ID
Chat `/start` ke bot lo → bot bales `Chat ID lo: 12345678` → masukin ke env `TELEGRAM_CHAT_ID` → redeploy.
Cek: kirim `/today` ke bot, harus muncul status + tombol centang.

### 7. Reminder 07.00 & 17.00 WIB

**Opsi A — cron-job.org (direkomendasiin, tepat waktu, gratis)**
Daftar di https://cron-job.org, bikin 2 job:

| Job | URL | Jadwal | Timezone |
|---|---|---|---|
| Pagi | `https://<project>.vercel.app/api/cron/remind?slot=morning` | tiap hari 07:00 | Asia/Jakarta |
| Sore | `https://<project>.vercel.app/api/cron/remind?slot=evening` | tiap hari 17:00 | Asia/Jakarta |

Di tab **Advanced → Headers** tambahin: `Authorization: Bearer <CRON_SECRET>`.
Klik **Test run** buat ngecek notifnya masuk.

**Opsi B — Vercel Cron (semua di Vercel, tapi bisa telat)**
Di plan Hobby, Vercel Cron cuma boleh sekali sehari per job dan dijalanin *kapan aja dalam jam itu* (07.00–07.59).
Kalau nggak masalah, tambahin ke `vercel.json` (jam dalam UTC; 00:00 UTC = 07:00 WIB):
```json
"crons": [
  { "path": "/api/cron/remind?slot=morning", "schedule": "0 0 * * *" },
  { "path": "/api/cron/remind?slot=evening", "schedule": "0 10 * * *" }
]
```
Vercel otomatis ngirim header `Authorization: Bearer <CRON_SECRET>`. Jangan pakai A dan B barengan, nanti notif dobel.

## Pakai
- Buka web → masukin password sekali per device/browser (cookie 1 tahun).
- Tap kartu = centang; tap lagi = batal. Lupa nyentang kemarin? Tap harinya di strip 7 hari.
- Timer puasa: **Mulai puasa** pas suapan terakhir; **Buka puasa** setelah target tembus → fasting kecentang sendiri.
- Telegram: tombol di pesan reminder langsung nyentang. Tombol di pesan lama masih bisa dipakai sampai 7 hari.

## Ngubah kebiasaan
Edit `lib/habits.js`. Ikon yang tersedia: `i-shield i-leaf i-run i-clock i-book i-pen`.
Key (`k`) jangan diganti buat kebiasaan lama, karena data disimpen per key. Nambah kebiasaan baru nggak perlu migrasi.

## Lokal
```bash
npm i -g vercel && npm install
vercel link && vercel env pull .env.local
vercel dev
```
Catatan: cookie login pakai `Secure`, jadi di `http://localhost` login lewat `vercel dev` mungkin nggak nyimpen cookie di Safari; Chrome aman.

## Data
```sql
-- satu baris = satu kebiasaan dicentang di satu hari
habit_log(day date, habit text, created_at timestamptz, primary key(day, habit))
app_settings(id=1, fast_target int, fast_start timestamptz)
```
Ekspor: `psql $DATABASE_URL -c "\copy (select * from habit_log order by day) to 'streak.csv' csv header"`
