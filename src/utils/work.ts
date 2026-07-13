// Public base URL of the Vercel Blob store. Reading blobs by their fixed URL
// is free Data Transfer; calling list()/head() would burn "advanced operations".
// Overridable via env so switching to a new store is a config change, not code.
export const WORK_BLOB_BASE =
  import.meta.env.BLOB_BASE_URL ||
  process.env.BLOB_BASE_URL ||
  'https://kmsfokjxxwt6l5xp.public.blob.vercel-storage.com'

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
  // Read by fixed public URL (free Data Transfer) — no list()/head(). Cache-bust
  // so pages reflect the most recent sync.
  const res = await fetch(`${WORK_BLOB_BASE}/${WORK_BLOB_PATH}?t=${Date.now()}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null

  try {
    return (await res.json()) as WorkData
  } catch {
    return null
  }
}
