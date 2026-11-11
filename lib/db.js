import { neon } from "@neondatabase/serverless";
import { HABIT_KEYS } from "./habits.js";

let _sql;
export function sql(strings, ...values) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum di-set");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql(strings, ...values);
}

export async function migrate() {
  await sql`create table if not exists habit_log (
    day        date        not null,
    habit      text        not null,
    created_at timestamptz not null default now(),
    primary key (day, habit)
  )`;
  await sql`create table if not exists app_settings (
    id          int primary key default 1 check (id = 1),
    fast_target int not null default 16,
    fast_start  timestamptz
  )`;
  await sql`insert into app_settings (id) values (1) on conflict (id) do nothing`;
}

// Baris ada = kebiasaan itu dicentang di hari itu.
export async function loadDays(sinceKey) {
  const rows = sinceKey
    ? await sql`select day::text as day, habit from habit_log where day >= ${sinceKey}::date`
    : await sql`select day::text as day, habit from habit_log`;
  const days = {};
  for (const r of rows) {
    if (!HABIT_KEYS.includes(r.habit)) continue;
    (days[r.day] ||= {})[r.habit] = true;
  }
  return days;
}

export async function setHabit(day, habit, done) {
  if (done) await sql`insert into habit_log (day, habit) values (${day}::date, ${habit}) on conflict do nothing`;
  else await sql`delete from habit_log where day = ${day}::date and habit = ${habit}`;
}

export async function loadSettings() {
  const [row] = await sql`select fast_target, extract(epoch from fast_start) * 1000 as fast_start from app_settings where id = 1`;
  return {
    fastTarget: row ? Number(row.fast_target) : 16,
    fastStart: row && row.fast_start != null ? Math.round(Number(row.fast_start)) : null,
  };
}

export async function saveSettings({ fastTarget, fastStart }) {
  const start = fastStart ? new Date(fastStart).toISOString() : null;
  await sql`insert into app_settings (id, fast_target, fast_start) values (1, ${fastTarget}, ${start})
            on conflict (id) do update set fast_target = excluded.fast_target, fast_start = excluded.fast_start`;
}
