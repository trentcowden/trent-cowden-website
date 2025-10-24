import { config } from 'dotenv'
import { cert, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

config()

const app = initializeApp(
  {
    credential: cert({
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    }),
    storageBucket: 'audiobooks-e739c.firebasestorage.app',
  },
  'audiobooks'
)

export const storage = getStorage(app)
export const bucket = storage.bucket()
