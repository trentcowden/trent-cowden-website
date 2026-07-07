import { list } from '@vercel/blob'

// Fixed pathname the sync endpoint writes to and the /work pages read from.
export const WORK_BLOB_PATH = 'work/data.json'

export type TaskStatus = 'incomplete' | 'completed' | 'canceled'

export type TaskStart = 'Inbox' | 'Anytime' | 'Someday' | null

export interface WorkTask {
  uuid: string
  title: string
  status: TaskStatus
  start: TaskStart // 'Someday' = backlog
  tags: string[]
  deadline: string | null
  startDate: string | null
  stopDate: string | null
  created: string | null
  modified: string | null
}

export interface WorkGroup {
  title: string | null
  slug: string
  counts: { total: number; incomplete: number }
  tasks: WorkTask[]
}

export interface WorkData {
  generatedAt: string
  project: { uuid: string; title: string }
  groups: WorkGroup[]
}

/**
 * Fetch the latest synced Things data from Vercel Blob. Returns null if the
 * sync has never run (no blob yet) or the data can't be read/parsed.
 */
export async function getWorkData(): Promise<WorkData | null> {
  // In prod Vercel injects BLOB_READ_WRITE_TOKEN into process.env. Under
  // `astro dev` it's only in import.meta.env (from .env), so pass it explicitly.
  const token =
    import.meta.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN

  const { blobs } = await list({ prefix: WORK_BLOB_PATH, token })
  const blob = blobs.find((b) => b.pathname === WORK_BLOB_PATH)
  if (!blob) return null

  // Cache-bust the CDN so pages reflect the most recent sync.
  const res = await fetch(`${blob.url}?t=${Date.now()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null

  try {
    return (await res.json()) as WorkData
  } catch {
    return null
  }
}
