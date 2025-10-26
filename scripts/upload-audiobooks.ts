import * as fs from 'fs'
import { parseFile } from 'music-metadata'
import * as path from 'path'
import { bucket } from '../firebase'

const AUDIOBOOKS_DIR =
  '/Users/trentcowden/Library/Mobile Documents/com~apple~CloudDocs/Audiobooks'
const FIREBASE_PREFIX = 'audiobooks/'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

async function uploadAudiobook(filePath: string) {
  const filename = path.basename(filePath)
  const firebasePath = `${FIREBASE_PREFIX}${filename}`

  console.log(`\n📚 Processing: ${filename}`)

  // Check if file already exists in Firebase
  const audioFile = bucket.file(firebasePath)
  const [exists] = await audioFile.exists()

  if (exists) {
    console.log(`  ✓ Audio file already exists in Firebase`)
    const [metadata] = await audioFile.getMetadata()

    // Check if we need to update metadata
    if (metadata.metadata?.duration && metadata.metadata?.coverImagePath) {
      console.log(`  ✓ Metadata already cached, skipping`)
      return
    }
    console.log(`  ℹ Updating metadata...`)
  } else {
    // Upload the audio file
    console.log(`  ⬆️  Uploading audio file...`)
    await bucket.upload(filePath, {
      destination: firebasePath,
      metadata: {
        contentType: filename.toLowerCase().endsWith('.m4b')
          ? 'audio/mp4'
          : 'audio/mpeg',
      },
    })
    console.log(`  ✓ Uploaded audio file`)
  }

  // Parse audio metadata
  console.log(`  🔍 Extracting metadata...`)
  const audioMetadata = await parseFile(filePath, {
    duration: true,
    skipCovers: false,
  })

  const metadataUpdates: { [key: string]: any } = {}

  // Extract duration
  if (audioMetadata.format.duration) {
    const duration = formatDuration(audioMetadata.format.duration)
    metadataUpdates.duration = duration
    console.log(`  ✓ Duration: ${duration}`)
  }

  // Extract and upload cover art
  if (audioMetadata.common.picture && audioMetadata.common.picture.length > 0) {
    const picture = audioMetadata.common.picture[0]
    if (picture) {
      console.log(`  🖼️  Found cover art (${picture.format})`)

      // Determine file extension from MIME type
      const ext = picture.format === 'image/png' ? 'png' : 'jpg'
      const coverFileName = filename.replace(/\.(mp3|m4b)$/i, `.${ext}`)
      const coverPath = `audiobooks/covers/${coverFileName}`

      // Upload cover image
      const coverFile = bucket.file(coverPath)
      await coverFile.save(picture.data, {
        metadata: {
          contentType: picture.format,
        },
      })
      console.log(`  ✓ Uploaded cover art to ${coverPath}`)

      metadataUpdates.coverImagePath = coverPath
    }
  } else {
    console.log(`  ⚠️  No cover art found`)
  }

  // Update audio file metadata with cached values
  if (Object.keys(metadataUpdates).length > 0) {
    await audioFile.setMetadata({
      metadata: metadataUpdates,
    })
    console.log(`  ✓ Cached metadata in Firebase`)
  }
}

async function main() {
  console.log('🚀 Audiobook Upload Script')
  console.log('==========================\n')
  console.log(`Local directory: ${AUDIOBOOKS_DIR}`)
  console.log(`Firebase bucket: ${bucket.name}\n`)

  // Read all files from local directory
  const files = fs.readdirSync(AUDIOBOOKS_DIR)
  const audioFiles = files.filter(
    (file) =>
      file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.m4b')
  )

  console.log(`Found ${audioFiles.length} audiobook(s) to process\n`)

  // Process each audiobook
  for (const file of audioFiles) {
    try {
      const filePath = path.join(AUDIOBOOKS_DIR, file)
      await uploadAudiobook(filePath)
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error)
    }
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)
