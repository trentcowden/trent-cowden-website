export const prerender = false

import type { File } from '@google-cloud/storage'
import type { APIRoute } from 'astro'
import { bucket } from '../../../firebase'

interface AudiobookMetadata {
  title: string
  author: string
  description: string
  duration?: string
  pubDate: Date
  url: string
  size: number
  type: string
  guid: string
  imageUrl?: string
}

export const GET: APIRoute = async ({ site }) => {
  try {
    const siteUrl = site?.toString() || 'https://example.com'

    // Get all files from the audiobooks folder
    const [files] = await bucket.getFiles({
      prefix: 'audiobooks/',
    })

    // Filter for audio files (mp3 or m4b)
    const audioFiles = files.filter((file: File) => {
      const name = file.name.toLowerCase()
      return name.endsWith('.mp3') || name.endsWith('.m4b')
    })

    // Get metadata and signed URLs for each audiobook
    const audiobooks: AudiobookMetadata[] = await Promise.all(
      audioFiles.map(async (file: File) => {
        const [metadata] = await file.getMetadata()
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        })

        // Get cached duration
        const duration = metadata.metadata?.duration as string | undefined

        // Get cached cover image URL
        let coverImageUrl: string | undefined
        if (metadata.metadata?.coverImagePath) {
          const coverPath = metadata.metadata.coverImagePath as string
          try {
            const coverFile = bucket.file(coverPath)
            const [coverUrl] = await coverFile.getSignedUrl({
              action: 'read',
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
            })
            coverImageUrl = coverUrl
          } catch (error) {
            console.error(
              `Failed to get cover image URL for ${file.name}:`,
              error
            )
          }
        }

        // Extract filename without extension
        const filename = file.name
          .replace('audiobooks/', '')
          .replace(/\.(mp3|m4b)$/i, '')

        // Try to parse title and author from filename (format: "Title - Author" or just "Title")
        const parts = filename.split('-')
        let series
        let name
        let author

        if (parts.length === 3) {
          series = parts[0]?.trim().replace(/_/g, ' ')
          name = parts[1]?.trim().replace(/_/g, ' ')
          author = parts[2]?.trim().replace(/_/g, ' ') ?? 'Unknown Author'
        } else {
          name = parts[0]?.trim().replace(/_/g, ' ')
          author = parts[1]?.trim().replace(/_/g, ' ') ?? 'Unknown Author'
        }

        const title =
          (series ? `${series} - ` : '') + (name || 'Untitled') + ` - ${author}`

        // Use file path as stable GUID (won't change when signed URLs regenerate)
        const guid = `${siteUrl}/audiobooks/${file.name}`

        return {
          title,
          author,
          description:
            (metadata.metadata?.description as string) || `Audiobook: ${title}`,
          pubDate: new Date(metadata.timeCreated || Date.now()),
          url,
          size:
            typeof metadata.size === 'string'
              ? parseInt(metadata.size, 10)
              : metadata.size || 0,
          type: file.name.toLowerCase().endsWith('.m4b')
            ? 'audio/x-m4b'
            : 'audio/mpeg',
          duration,
          guid,
          imageUrl: coverImageUrl,
        }
      })
    )

    // Sort by publication date (newest first)
    audiobooks.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())

    console.log(`Found ${audiobooks.length} audiobooks`)

    // Generate RSS feed
    const rss = generateRSS(audiobooks, siteUrl)

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control':
          'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error generating audiobooks RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}

function generateRSS(audiobooks: AudiobookMetadata[], siteUrl: string): string {
  const now = new Date().toUTCString()
  const feedUrl = `${siteUrl}/api/audiobooks.xml`

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Trent Cowden's Audiobooks</title>
    <link>${siteUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <description>Personal audiobook collection</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <itunes:author>Trent Cowden</itunes:author>
    <itunes:summary>Personal audiobook collection</itunes:summary>
    <itunes:owner>
      <itunes:name>Trent Cowden</itunes:name>
      <itunes:email>trent.cowden@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Arts">
      <itunes:category text="Books"/>
    </itunes:category>
${audiobooks
  .map(
    (audiobook) => `    <item>
      <title>${escapeXml(audiobook.title)}</title>
      <itunes:author>${escapeXml(audiobook.author)}</itunes:author>
      <description>${escapeXml(audiobook.description)}</description>
      <pubDate>${audiobook.pubDate.toUTCString()}</pubDate>
      <enclosure url="${escapeXml(audiobook.url)}" length="${
      audiobook.size
    }" type="${audiobook.type}"/>
      <guid isPermaLink="false">${escapeXml(audiobook.guid)}</guid>${
      audiobook.duration
        ? `
      <itunes:duration>${audiobook.duration}</itunes:duration>`
        : ''
    }${
      audiobook.imageUrl
        ? `
      <itunes:image href="${escapeXml(audiobook.imageUrl)}"/>`
        : ''
    }
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
