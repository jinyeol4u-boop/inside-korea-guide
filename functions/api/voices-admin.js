// Moderation API (used by /voices-admin). Requires header X-Admin-Key = env.ADMIN_KEY.
// GET  -> pending stories (oldest first)
// POST {id, action: "approve" | "reject" | "delete"}
import { json, db } from '../_lib/voices.js';

async function authorized(request, env) {
  const key = request.headers.get('X-Admin-Key') || '';
  if (!env.ADMIN_KEY || key.length !== env.ADMIN_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ env.ADMIN_KEY.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  const d = await db(env);
  if (!d) return json({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401);
  const status = new URL(request.url).searchParams.get('status') === 'approved' ? 'approved' : 'pending';
  const { results } = await d.prepare(
    `SELECT id, name, country, visit, topic, title, body, created_at, status FROM voices WHERE status = ? ORDER BY id ${status === 'pending' ? 'ASC' : 'DESC'} LIMIT 100`
  ).bind(status).all();
  return json({ items: results });
}

export async function onRequestPost({ request, env }) {
  const d = await db(env);
  if (!d) return json({ error: 'not_configured' }, 503);
  if (!(await authorized(request, env))) return json({ error: 'unauthorized' }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const id = parseInt(b.id, 10);
  if (!id) return json({ error: 'bad_request' }, 400);
  if (b.action === 'delete') await d.prepare('DELETE FROM voices WHERE id = ?').bind(id).run();
  else if (b.action === 'approve' || b.action === 'reject')
    await d.prepare('UPDATE voices SET status = ?, reviewed_at = ? WHERE id = ?').bind(b.action === 'approve' ? 'approved' : 'rejected', new Date().toISOString(), id).run();
  else return json({ error: 'bad_request' }, 400);
  return json({ ok: true });
}
