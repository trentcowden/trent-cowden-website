export const prerender = false

import { randomUUID } from 'node:crypto'

import type { APIRoute } from 'astro'
import { put } from '@vercel/blob'

import { WORK_BLOB_BASE } from '@/utils/work'

// Single queue file (an array). Kept as one blob so draining an empty queue
// reads by URL (free) instead of calling list() (an advanced operation).
export const QUEUE_PATH = 'work/queue.json'

const MAX_TITLE = 200
const MAX_PROJECT = 120

export interface QueueItem {
  id: string
  title: string
  project: string | null
  createdAt: string
}

export const blobToken = () =>
  import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

/** Read the queue by its fixed public URL — no list()/head(). */
export async function readQueue(): Promise<QueueItem[]> {
  const res = await fetch(`${WORK_BLOB_BASE}/${QUEUE_PATH}?t=${Date.now()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return [] // 404 = never created yet
  try {
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function writeQueue(items: QueueItem[]): Promise<void> {
  await put(QUEUE_PATH, JSON.stringify(items), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    token: blobToken(),
  })
}

/**
 * Public endpoint: a visitor submits a task from the /work form. Appended to
 * the queue; the owner's Mac drains it into Things (see sync.py).
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

  const queue = await readQueue()
  queue.push({
    id: randomUUID(),
    title,
    project: project || null,
    createdAt: new Date().toISOString(),
  })
  await writeQueue(queue)

  return json({ ok: true }, 200)
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
