import seedFile from './shop.seed.json'
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from '../lib/firebase.js'

const STORAGE_KEY = 'mooca.shop.v1'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

const seedItems = Array.isArray(seedFile.items) ? seedFile.items : []

const sortByOrder = (items) =>
  [...items].sort((a, b) => Number(a.order) - Number(b.order))

const readLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(raw?.items)) return sortByOrder(raw.items)
  } catch {
    /* ignore */
  }
  return sortByOrder(seedItems.map((item) => ({ ...item })))
}

const writeLocal = (items) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: sortByOrder(items) }),
  )
}

const normalizeItem = (item) => ({
  id: String(item.id),
  imageUrl: String(item.imageUrl || ''),
  order: Number(item.order) || 1,
  updatedAt: item.updatedAt || null,
})

export { isFirebaseConfigured }

export async function listShopItems() {
  if (isFirebaseConfigured()) {
    try {
      const db = await getFirebaseDb()
      if (!db) return readLocal()
      const { collection, getDocs } = await import('firebase/firestore')
      const snap = await getDocs(collection(db, 'shopItems'))
      const items = snap.docs.map((docSnap) =>
        normalizeItem({ id: docSnap.id, ...docSnap.data() }),
      )
      if (!items.length) return readLocal()
      return sortByOrder(items)
    } catch (error) {
      console.warn('Firestore shop read failed; using local.', error)
      return readLocal()
    }
  }
  return readLocal()
}

const nextOrder = (items) =>
  items.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0) + 1

const newId = () =>
  `shop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export async function createShopItem({ imageUrl = '' } = {}) {
  const items = await listShopItems()
  const item = normalizeItem({
    id: newId(),
    imageUrl,
    order: nextOrder(items),
    updatedAt: new Date().toISOString(),
  })

  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    if (!db) throw new Error('Firebase가 아직 연결되지 않았습니다.')
    const writer = (await getFirebaseAuth())?.currentUser
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(doc(db, 'shopItems', item.id), {
      id: item.id,
      imageUrl: item.imageUrl,
      order: item.order,
      updatedAt: serverTimestamp(),
      ...(writer?.email || writer?.uid
        ? { updatedBy: writer.email || writer.uid }
        : {}),
    })
    return (await listShopItems()).find((row) => row.id === item.id) ?? item
  }

  const next = [...items, item]
  writeLocal(next)
  return item
}

export async function updateShopItem(id, patch) {
  const items = await listShopItems()
  const current = items.find((item) => item.id === id)
  if (!current) throw new Error('항목을 찾을 수 없습니다.')

  const next = normalizeItem({
    ...current,
    imageUrl:
      patch.imageUrl === undefined ? current.imageUrl : String(patch.imageUrl),
    order:
      patch.order === undefined ? current.order : Number(patch.order) || current.order,
    updatedAt: new Date().toISOString(),
  })

  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    if (!db) throw new Error('Firebase가 아직 연결되지 않았습니다.')
    const writer = (await getFirebaseAuth())?.currentUser
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(
      doc(db, 'shopItems', id),
      {
        id,
        imageUrl: next.imageUrl,
        order: Math.round(Number(next.order)),
        updatedAt: serverTimestamp(),
        ...(writer?.email || writer?.uid
          ? { updatedBy: writer.email || writer.uid }
          : {}),
      },
      { merge: true },
    )
    return (await listShopItems()).find((row) => row.id === id)
  }

  writeLocal(items.map((item) => (item.id === id ? next : item)))
  return next
}

export async function deleteShopItem(id) {
  const items = await listShopItems()
  if (!items.some((item) => item.id === id)) {
    throw new Error('항목을 찾을 수 없습니다.')
  }

  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    if (!db) throw new Error('Firebase가 아직 연결되지 않았습니다.')
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'shopItems', id))
    return
  }

  writeLocal(items.filter((item) => item.id !== id))
}

export async function uploadShopImage(id, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('JPG, PNG, WebP만 올릴 수 있습니다.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('이미지는 4MB 이하여야 합니다.')
  }

  const ext =
    file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'

  if (isFirebaseConfigured()) {
    const storage = await getFirebaseStorage()
    if (!storage) throw new Error('Firebase가 아직 연결되지 않았습니다.')
    const { getDownloadURL, ref, uploadBytes } = await import('firebase/storage')
    const path = `shop/${id}.${ext}`
    const fileRef = ref(storage, path)
    await uploadBytes(fileRef, file, { contentType: file.type })
    const imageUrl = await getDownloadURL(fileRef)
    return updateShopItem(id, { imageUrl })
  }

  const imageUrl = await fileToDataUrl(file)
  return updateShopItem(id, { imageUrl })
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })
