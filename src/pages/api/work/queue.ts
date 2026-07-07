export const prerender = false

import type { APIRoute } from 'astro'
import { del, list } from '@vercel/blob'

import { QUEUE_PREFIX } from '@/pages/api/work/assign'

const blobToken = () =>
  import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

function authed(request: Request): boolean {
  const secret = import.meta.env.SYNC_SECRET || process.env.SYNC_SECRET
  return !!secret && request.headers.get('x-sync-secret') === secret
}

/** Owner's Mac (with the shared secret) fetches pending queued tasks. */
export const GET: APIRoute = async ({ request }) => {
  if (!authed(request)) return json({ error: 'unauthorized' }, 401)

  const { blobs } = await list({ prefix: QUEUE_PREFIX, token: blobToken() })
  const items = []
  for (const blob of blobs) {
    try {
      const res = await fetch(blob.url)
      if (!res.ok) continue
      items.push({ ...(await res.json()), url: blob.url })
    } catch {
      // skip unreadable entries
    }
  }
  return json({ items }, 200)
}

/** After relaying tasks into Things, the Mac acks them here for deletion. */
export const DELETE: APIRoute = async ({ request }) => {
  if (!authed(request)) return json({ error: 'unauthorized' }, 401)

  let body: { urls?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.filter(
        (u): u is string => typeof u === 'string' && u.includes(`/${QUEUE_PREFIX}`)
      )
    : []
  if (urls.length) await del(urls, { token: blobToken() })
  return json({ ok: true, deleted: urls.length }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
