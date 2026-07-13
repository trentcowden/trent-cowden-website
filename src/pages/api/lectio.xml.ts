export const prerender = false

import type { APIRoute } from 'astro'

import { BLOB_BASE_URL } from '@/utils/blob'
import {
  LECTIO_MANIFEST_PATH,
  type LectioManifestItem,
} from '@/pages/api/lectio/cron'

const PRAYER_TITLES: Record<string, string> = {
  morning: 'Morning Prayer',
  midday: 'Midday Prayer',
  night: 'Night Prayer',
}

// Hours in Pacific time (UTC-8), stored as UTC offsets
const PRAYER_HOURS_UTC: Record<string, number> = {
  morning: 15, // 7 AM Pacific
  midday: 20, // 12 PM Pacific
  night: 5, // 9 PM Pacific (next day UTC)
}

interface LectioEpisode {
  date: string
  type: string
  title: string
  pubDate: Date
  url: string
  size: number
  guid: string
}

export const GET: APIRoute = async ({ site }) => {
  try {
    const siteUrl = site?.toString().replace(/\/$/, '') || 'https://trentcowden.com'

    // Read the manifest by fixed URL (free) instead of calling list().
    const res = await fetch(`${BLOB_BASE_URL}/${LECTIO_MANIFEST_PATH}?t=${Date.now()}`, {
      cache: 'no-store',
    })
    let manifest: LectioManifestItem[] = []
    if (res.ok) {
      try {
        const data = await res.json()
        if (Array.isArray(data)) manifest = data
      } catch {
        // fall through to an empty feed
      }
    }

    const episodes: LectioEpisode[] = manifest.map(({ date, type, url, size }) => {
      const hour = PRAYER_HOURS_UTC[type] ?? 15
      const pubDate = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00Z`)
      if (type === 'night') pubDate.setUTCDate(pubDate.getUTCDate() + 1)

      return {
        date,
        type,
        title: PRAYER_TITLES[type] ?? type,
        pubDate,
        url,
        size,
        guid: `${siteUrl}/lectio/${date}-${type}`,
      }
    })

    // Sort newest first, then night > midday > morning within same day
    episodes.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return (PRAYER_HOURS_UTC[b.type] ?? 0) - (PRAYER_HOURS_UTC[a.type] ?? 0)
    })

    const rss = generateRSS(episodes, siteUrl)

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control':
          'public, max-age=0, s-maxage=3600, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error generating Lectio RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}

function generateRSS(episodes: LectioEpisode[], siteUrl: string): string {
  const now = new Date().toUTCString()
  const feedUrl = `${siteUrl}/api/lectio.xml`

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lectio 365</title>
    <link>https://www.24-7prayer.com/resource/lectio-365/</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <description>Daily prayer audio from Lectio 365 — morning, midday, and night prayers by 24-7 Prayer.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <itunes:author>24-7 Prayer</itunes:author>
    <itunes:summary>Daily prayer audio from Lectio 365</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Religion &amp; Spirituality">
      <itunes:category text="Christianity"/>
    </itunes:category>
${episodes
  .map(
    (ep) => `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(`${PRAYER_TITLES[ep.type] ?? ep.type} for ${ep.date}`)}</description>
      <pubDate>${ep.pubDate.toUTCString()}</pubDate>
      <enclosure url="${escapeXml(ep.url)}" length="${ep.size}" type="audio/mpeg"/>
      <guid isPermaLink="false">${escapeXml(ep.guid)}</guid>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
