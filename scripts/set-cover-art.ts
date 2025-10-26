import * as path from 'path'
import { bucket } from '../firebase'

/**
 * Manually set cover art for an audiobook
 *
 * Usage:
 * yarn set-cover "audiobook-filename.m4b" "path/to/cover.jpg"
 */

async function setCoverArt(audiobookFilename: string, coverImagePath: string) {
  const audioPath = `audiobooks/${audiobookFilename}`
  const audioFile = bucket.file(audioPath)

  console.log(`📚 Setting cover art for: ${audiobookFilename}`)

  // Check if audiobook exists
  const [exists] = await audioFile.exists()
  if (!exists) {
    console.error(`❌ Audiobook not found: ${audioPath}`)
    return
  }

  // Determine cover path
  const ext = path.extname(coverImagePath).toLowerCase().replace('.', '')
  const coverFileName = audiobookFilename.replace(/\.(mp3|m4b)$/i, `.${ext}`)
  const coverPath = `audiobooks/covers/${coverFileName}`

  // Upload cover image
  console.log(`⬆️  Uploading cover to: ${coverPath}`)
  const [uploadedFile] = await bucket.upload(coverImagePath, {
    destination: coverPath,
    metadata: {
      contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    },
  })
  console.log(`✓ Uploaded cover image`)

  // Update audiobook metadata
  const [metadata] = await audioFile.getMetadata()
  await audioFile.setMetadata({
    metadata: {
      ...metadata.metadata,
      coverImagePath: coverPath,
    },
  })
  console.log(`✓ Linked cover art to audiobook`)
  console.log(`✅ Done!`)
}

// Get arguments
const audiobookFilename = process.argv[2]
const coverImagePath = process.argv[3]

if (!audiobookFilename || !coverImagePath) {
  console.error('Usage: yarn set-cover <audiobook-filename> <cover-image-path>')
  console.error('Example: yarn set-cover "My_Book-Author.m4b" "./cover.jpg"')
  process.exit(1)
}

setCoverArt(audiobookFilename, coverImagePath).catch(console.error)
