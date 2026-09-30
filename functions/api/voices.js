// GET  /api/voices?topic=&before=&limit=  -> approved stories, newest first
// POST /api/voices                        -> new story, stored as "pending" until reviewed
import { TOPICS, VISITS, json, db, hash, clean, PUBLIC_COLS } from '../_lib/voices.js';

export async function onRequestGet({ request, env }) {
  const d = await db(env);
  if (!d) return json({ error: 'not_configured' }, 503);
  const u = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(u.searchParams.get('limit') || '20', 10) || 20, 1), 50);
  const topic = u.searchParams.get('topic');
  const before = parseInt(u.searchParams.get('before') || '0', 10);
  let sql = `SELECT ${PUBLIC_COLS} FROM voices WHERE status = 'approved'`;
  const args = [];
  if (topic && TOPICS.includes(topic)) { sql += ' AND topic = ?'; args.push(topic); }
  if (before > 0) { sql += ' AND id < ?'; args.push(before); }
  sql += ' ORDER BY id DESC LIMIT ?'; args.push(limit + 1);
  const { results } = await d.prepare(sql).bind(...args).all();
  return json({ items: results.slice(0, limit), more: results.length > limit });
}

export async function onRequestPost({ request, env }) {
  const d = await db(env);
  if (!d) return json({ error: 'not_configured' }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad_request', message: 'Invalid submission.' }, 400); }

  // Quiet spam traps: filled honeypot or a form sent in under 5 seconds looks "accepted" but is dropped.
  if (b.website || (Number(b.elapsed) || 0) < 5000) return json({ ok: true });

  const v = {
    name: clean(b.name, 40), country: clean(b.country, 40), visit: clean(b.visit, 30),
    topic: clean(b.topic, 30), title: clean(b.title, 80), body: clean(b.body, 1500)
  };
  const fail = m => json({ error: 'invalid', message: m }, 400);
  if (b.consent !== true) return fail('Please tick the box to confirm the guidelines.');
  if (!v.country) return fail('Please tell us which country you are from.');
  if (!VISITS.includes(v.visit)) return fail('Please choose your connection to Korea.');
  if (!TOPICS.includes(v.topic)) return fail('Please choose a topic.');
  if (v.title.length < 5) return fail('Please add a short headline.');
  if (v.body.length < 80) return fail('Your story needs at least 80 characters.');
  if (/(https?:\/\/|www\.|\.com\b|@)/i.test(`${v.name} ${v.title} ${v.body}`)) return fail('Please remove links, email addresses or contact details.');

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = await hash(ip + '|' + (env.ADMIN_KEY || 'ikg'));
  const since = new Date(Date.now() - 864e5).toISOString();
  const recent = await d.prepare('SELECT COUNT(*) AS n FROM voices WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first();
  if ((recent?.n || 0) >= 3) return json({ error: 'rate_limited', message: 'Thank you! You have shared several stories today. Please come back tomorrow.' }, 429);

  await d.prepare('INSERT INTO voices (name, country, visit, topic, title, body, status, created_at, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(v.name, v.country, v.visit, v.topic, v.title, v.body, 'pending', new Date().toISOString(), ipHash).run();
  return json({ ok: true }, 201);
}
