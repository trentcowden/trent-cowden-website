// Public base URL of the Vercel Blob store. Reading blobs by their fixed URL is
// free Data Transfer; list()/head() would burn "advanced operations". Override
// via the BLOB_BASE_URL env var if the store ever changes.
export const BLOB_BASE_URL =
  import.meta.env.BLOB_BASE_URL ||
  process.env.BLOB_BASE_URL ||
  'https://kmsfokjxxwt6l5xp.public.blob.vercel-storage.com'
