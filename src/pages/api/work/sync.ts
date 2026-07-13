export const prerender = false

import type { APIRoute } from 'astro'
import { put } from '@vercel/blob'

import { WORK_BLOB_PATH, workBlobToken } from '@/utils/work'

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    return json({ error: 'SYNC_SECRET not configured' }, 500)
  }
  if (request.headers.get('x-sync-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401)
  }

  let body: string
  try {
    body = JSON.stringify(await request.json())
  } catch {
    return json({ error: 'invalid JSON body' }, 400)
  }

  const blob = await put(WORK_BLOB_PATH, body, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    // Data changes hourly; don't let CDN serve it stale for long.
    cacheControlMaxAge: 60,
    token: workBlobToken(),
  })

  console.log(`work sync: stored ${body.length} bytes at ${blob.url}`)
  return json({ ok: true, url: blob.url, bytes: body.length }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
