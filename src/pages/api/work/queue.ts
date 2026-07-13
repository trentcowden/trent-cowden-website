export const prerender = false

import type { APIRoute } from 'astro'

import { readQueue, writeQueue } from '@/pages/api/work/assign'

function authed(request: Request): boolean {
  const secret = import.meta.env.SYNC_SECRET || process.env.SYNC_SECRET
  return !!secret && request.headers.get('x-sync-secret') === secret
}

/** Owner's Mac (with the shared secret) fetches pending queued tasks. */
export const GET: APIRoute = async ({ request }) => {
  if (!authed(request)) return json({ error: 'unauthorized' }, 401)
  return json({ items: await readQueue() }, 200)
}

/** After relaying tasks into Things, the Mac acks them by id for removal. */
export const DELETE: APIRoute = async ({ request }) => {
  if (!authed(request)) return json({ error: 'unauthorized' }, 401)

  let body: { ids?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  const ids = new Set(
    Array.isArray(body.ids) ? body.ids.filter((i): i is string => typeof i === 'string') : []
  )
  if (!ids.size) return json({ ok: true, deleted: 0 }, 200)

  const queue = await readQueue()
  const remaining = queue.filter((item) => !ids.has(item.id))
  // Only write when something actually changed (avoid a needless advanced op).
  if (remaining.length !== queue.length) await writeQueue(remaining)
  return json({ ok: true, deleted: queue.length - remaining.length }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
