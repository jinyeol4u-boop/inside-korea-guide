// Shared helpers for Korea Voices (Cloudflare Pages Functions + D1)
// Required bindings (Cloudflare dashboard > Pages project > Settings):
//   D1 database binding  VOICES_DB
//   Secret variable      ADMIN_KEY   (password for /voices-admin)
export const TOPICS = ['First impressions','What surprised me','Food','Getting around','People and culture','Tips for first-timers','Other'];
export const VISITS = ['First trip','Returning visitor','Living in Korea','Planning a trip'];

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  });
}

export async function db(env) {
  if (!env.VOICES_DB) return null;
  await env.VOICES_DB.prepare(`CREATE TABLE IF NOT EXISTS voices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, country TEXT, visit TEXT, topic TEXT, title TEXT, body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL, reviewed_at TEXT, ip_hash TEXT)`).run();
  return env.VOICES_DB;
}

export async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

export const PUBLIC_COLS = 'id, name, country, visit, topic, title, body, created_at';
