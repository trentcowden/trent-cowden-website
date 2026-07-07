export const prerender = false

import { randomUUID } from 'node:crypto'

import type { APIRoute } from 'astro'
import { put } from '@vercel/blob'

// Where queued (not-yet-relayed) task submissions live.
export const QUEUE_PREFIX = 'work/queue/'

const MAX_TITLE = 200
const MAX_PROJECT = 120

const blobToken = () =>
  import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

/**
 * Public endpoint: a visitor submits a task from the /work form. We enqueue it
 * as a small blob; the owner's Mac drains the queue into Things (see sync.py).
 */
export const POST: APIRoute = async ({ request }) => {
  // Only accept same-origin submissions — a mild deterrent against drive-by bots.
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'forbidden' }, 403)
  }

  let body: { title?: unknown; project?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const project =
    typeof body.project === 'string' ? body.project.trim().slice(0, MAX_PROJECT) : ''
  if (!title) return json({ error: 'title required' }, 400)
  if (title.length > MAX_TITLE) return json({ error: 'title too long' }, 400)

  const id = randomUUID()
  const item = {
    id,
    title,
    project: project || null,
    createdAt: new Date().toISOString(),
  }

  await put(`${QUEUE_PREFIX}${id}.json`, JSON.stringify(item), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token: blobToken(),
  })

  return json({ ok: true }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
