/**
 * Firebase client bootstrap.
 *
 * TODO: Bind a real Firebase project. Do not invent a project ID.
 * Copy `.env.example` to `.env.local` and fill VITE_FIREBASE_* from the
 * Firebase console after the project exists.
 */

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const readEnv = (key) => String(import.meta.env[key] ?? '').trim()

export function isFirebaseConfigured() {
  return requiredKeys.every((key) => {
    const value = readEnv(key)
    return value.length > 0 && !value.startsWith('TODO')
  })
}

let appPromise

export async function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      if (getApps().length) return getApps()[0]
      return initializeApp({
        apiKey: readEnv('VITE_FIREBASE_API_KEY'),
        authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
        storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: readEnv('VITE_FIREBASE_APP_ID'),
      })
    })()
  }
  return appPromise
}

export async function getFirebaseAuth() {
  const firebaseApp = await getFirebaseApp()
  if (!firebaseApp) return null
  const { getAuth } = await import('firebase/auth')
  return getAuth(firebaseApp)
}

export async function getFirebaseDb() {
  const firebaseApp = await getFirebaseApp()
  if (!firebaseApp) return null
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(firebaseApp)
}

export async function getFirebaseStorage() {
  const firebaseApp = await getFirebaseApp()
  if (!firebaseApp) return null
  const { getStorage } = await import('firebase/storage')
  return getStorage(firebaseApp)
}
