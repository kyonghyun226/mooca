import seedFile from './apps.seed.json'
import { APP_IDS } from './app-icons.js'
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from '../lib/firebase.js'

const STORAGE_KEY = 'mooca.apps.v1'
const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/webp']
const MAX_ICON_BYTES = 2 * 1024 * 1024

const seedApps = seedFile.apps

const mergeSeed = (record) => {
  const seed = seedApps.find((item) => item.id === record.id) ?? {}
  const merged = {
    ...seed,
    ...record,
    id: record.id,
    tags: Array.isArray(record.tags) ? record.tags : seed.tags ?? [],
    appStoreUrl: record.appStoreUrl ?? seed.appStoreUrl ?? '',
    googlePlayUrl: record.googlePlayUrl ?? seed.googlePlayUrl ?? '',
    iconUrl: record.iconUrl ?? seed.iconUrl ?? '',
    tagline: record.tagline ?? seed.tagline ?? '',
    body: record.body ?? seed.body ?? '',
    features: Array.isArray(record.features)
      ? record.features
      : Array.isArray(seed.features)
        ? seed.features
        : [],
    mockupUrls: Array.isArray(record.mockupUrls)
      ? record.mockupUrls
      : Array.isArray(seed.mockupUrls)
        ? seed.mockupUrls
        : [],
  }
  return merged
}

export async function getApp(id) {
  const apps = await listApps()
  return apps.find((app) => app.id === id) ?? null
}

const sortByOrder = (apps) =>
  [...apps].sort((a, b) => Number(a.order) - Number(b.order))

const readOverlay = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeOverlay = (overlay) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay))
}

const listLocal = () => {
  const overlay = readOverlay()
  return sortByOrder(
    seedApps.map((app) => mergeSeed({ ...app, ...overlay[app.id] })),
  )
}

const listFirestore = async () => {
  const db = await getFirebaseDb()
  if (!db) return listLocal()
  const { collection, getDocs } = await import('firebase/firestore')
  const snap = await getDocs(collection(db, 'apps'))
  const fromCloud = snap.docs.map((item) =>
    mergeSeed({ id: item.id, ...item.data() }),
  )
  const byId = new Map(fromCloud.map((app) => [app.id, app]))
  return sortByOrder(
    APP_IDS.map(
      (id) => byId.get(id) ?? mergeSeed(seedApps.find((app) => app.id === id)),
    ),
  )
}

export { isFirebaseConfigured }

export async function listApps() {
  if (isFirebaseConfigured()) {
    try {
      return await listFirestore()
    } catch (error) {
      console.warn('Firestore apps read failed; using local seed.', error)
      return listLocal()
    }
  }
  return listLocal()
}

export async function updateApp(id, patch) {
  if (!APP_IDS.includes(id)) {
    throw new Error('알 수 없는 앱입니다.')
  }

  const current = (await listApps()).find((app) => app.id === id)
  if (!current) throw new Error('알 수 없는 앱입니다.')

  const next = {
    name: String(patch.name ?? current.name).trim(),
    description: String(patch.description ?? current.description).trim(),
    iconUrl:
      patch.iconUrl === undefined ? current.iconUrl : String(patch.iconUrl),
    appStoreUrl: String(
      patch.appStoreUrl === undefined ? current.appStoreUrl : patch.appStoreUrl,
    ).trim(),
    googlePlayUrl: String(
      patch.googlePlayUrl === undefined
        ? current.googlePlayUrl
        : patch.googlePlayUrl,
    ).trim(),
    tagline: String(
      patch.tagline === undefined ? current.tagline ?? '' : patch.tagline,
    ).trim(),
    body: String(patch.body === undefined ? current.body ?? '' : patch.body).trim(),
    features: Array.isArray(patch.features)
      ? patch.features.map((item) => String(item).trim()).filter(Boolean)
      : current.features ?? [],
    mockupUrls: Array.isArray(patch.mockupUrls)
      ? patch.mockupUrls.map((item) => String(item).trim()).filter(Boolean)
      : current.mockupUrls ?? [],
  }

  if (!next.name) throw new Error('앱 이름을 입력해 주세요.')
  if (!next.description) throw new Error('한 줄 소개를 입력해 주세요.')
  if (next.description.length > 80) {
    throw new Error('한 줄 소개는 80자 이내여야 합니다.')
  }

  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    if (!db) {
      throw new Error('Firebase가 아직 연결되지 않았습니다.')
    }
    const writer = (await getFirebaseAuth())?.currentUser
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(
      doc(db, 'apps', id),
      {
        id,
        name: next.name,
        description: next.description,
        iconUrl: next.iconUrl,
        appStoreUrl: next.appStoreUrl,
        googlePlayUrl: next.googlePlayUrl,
        tagline: next.tagline,
        body: next.body,
        features: next.features,
        mockupUrls: next.mockupUrls,
        order: Math.round(Number(current.order)),
        updatedAt: serverTimestamp(),
        ...(writer?.email || writer?.uid
          ? { updatedBy: writer.email || writer.uid }
          : {}),
      },
      { merge: true },
    )
    const apps = await listApps()
    return apps.find((app) => app.id === id)
  }

  const overlay = readOverlay()
  overlay[id] = {
    ...overlay[id],
    name: next.name,
    description: next.description,
    iconUrl: next.iconUrl,
    appStoreUrl: next.appStoreUrl,
    googlePlayUrl: next.googlePlayUrl,
    tagline: next.tagline,
    body: next.body,
    features: next.features,
    mockupUrls: next.mockupUrls,
    updatedAt: new Date().toISOString(),
  }
  writeOverlay(overlay)
  return listLocal().find((app) => app.id === id)
}

export async function uploadIcon(id, file) {
  if (!APP_IDS.includes(id)) {
    throw new Error('알 수 없는 앱입니다.')
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('PNG, SVG, WebP만 올릴 수 있습니다.')
  }
  if (file.size > MAX_ICON_BYTES) {
    throw new Error('아이콘은 2MB 이하여야 합니다.')
  }

  const ext =
    file.type === 'image/svg+xml'
      ? 'svg'
      : file.type === 'image/webp'
        ? 'webp'
        : 'png'

  if (isFirebaseConfigured()) {
    const storage = await getFirebaseStorage()
    if (!storage) {
      throw new Error('Firebase가 아직 연결되지 않았습니다.')
    }
    const { getDownloadURL, ref, uploadBytes } = await import('firebase/storage')
    const path = `apps/${id}/icon.${ext}`
    const fileRef = ref(storage, path)
    await uploadBytes(fileRef, file, { contentType: file.type })
    const iconUrl = await getDownloadURL(fileRef)
    return updateApp(id, { iconUrl })
  }

  const iconUrl = await fileToDataUrl(file)
  return updateApp(id, { iconUrl })
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('아이콘을 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })


export async function uploadAppMockup(id, file) {
  if (!APP_IDS.includes(id)) throw new Error('알 수 없는 앱입니다.')
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    throw new Error('JPG, PNG, WebP만 올릴 수 있습니다.')
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error('이미지는 4MB 이하여야 합니다.')
  }
  const current = (await listApps()).find((app) => app.id === id)
  if (!current) throw new Error('알 수 없는 앱입니다.')

  const ext =
    file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'

  let url = ''
  if (isFirebaseConfigured()) {
    const storage = await getFirebaseStorage()
    if (!storage) throw new Error('Firebase가 아직 연결되지 않았습니다.')
    const { getDownloadURL, ref, uploadBytes } = await import('firebase/storage')
    const path = `apps/${id}/mockup-${Date.now()}.${ext}`
    const fileRef = ref(storage, path)
    await uploadBytes(fileRef, file, { contentType: file.type })
    url = await getDownloadURL(fileRef)
  } else {
    url = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
      reader.readAsDataURL(file)
    })
  }

  const mockupUrls = [...(current.mockupUrls ?? []), url]
  return updateApp(id, { mockupUrls })
}
