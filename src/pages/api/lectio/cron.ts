export const prerender = false

import type { APIRoute } from 'astro'
import { del, list, put } from '@vercel/blob'
import { unzipSync } from 'fflate'

const CDN_BASE =
  'https://lectiocdn.24-7prayer.com/lectio365-app/devotional-zips/production'

const PRAYER_TYPES = ['morning', 'midday', 'night'] as const

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export const GET: APIRoute = async () => {
  const results: { filename: string; status: string }[] = []
  const today = formatDate(new Date())

  // Delete old files to keep storage lean
  const { blobs } = await list({ prefix: 'lectio/' })
  for (const blob of blobs) {
    if (!blob.pathname.includes(today)) {
      await del(blob.url)
      results.push({ filename: blob.pathname, status: 'deleted' })
    }
  }

  // Download current day's devotionals
  const month = today.slice(0, 7)
  for (const type of PRAYER_TYPES) {
    const filename = `${today}-${type}.mp3`
    const storagePath = `lectio/${filename}`

    // Skip if already uploaded
    const existing = blobs.find((b) => b.pathname === storagePath)
    if (existing) {
      results.push({ filename, status: 'skipped' })
      continue
    }

    // Download zip from Lectio CDN
    const zipUrl = `${CDN_BASE}/${month}/${today}-${type}-en.zip`
    const response = await fetch(zipUrl)
    if (!response.ok) {
      results.push({ filename, status: `not-found (${response.status})` })
      continue
    }

    // Extract mp3 from zip
    const zipBuffer = new Uint8Array(await response.arrayBuffer())
    let mp3Data: Uint8Array | undefined
    try {
      const unzipped = unzipSync(zipBuffer)
      mp3Data = unzipped['audio-without-music.mp3']
    } catch (err) {
      results.push({ filename, status: 'unzip-failed' })
      continue
    }

    if (!mp3Data) {
      results.push({ filename, status: 'no-audio-in-zip' })
      continue
    }

    // Upload to Vercel Blob
    await put(storagePath, mp3Data, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
    })

    results.push({ filename, status: 'uploaded' })
  }

  const uploaded = results.filter((r) => r.status === 'uploaded').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const deleted = results.filter((r) => r.status === 'deleted').length
  const failed = results.filter(
    (r) => !['uploaded', 'skipped', 'deleted'].includes(r.status)
  ).length

  console.log(
    `Lectio cron: ${uploaded} uploaded, ${skipped} skipped, ${deleted} deleted, ${failed} failed`
  )

  return new Response(
    JSON.stringify(
      { summary: { uploaded, skipped, deleted, failed }, results },
      null,
      2
    ),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
