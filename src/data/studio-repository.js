import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from '../lib/firebase.js'

const COLLECTION = 'studioPhotos'
const STORAGE_KEY = 'mooca.studio.v1'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024
const MAX_CAPTION = 60

const sortByOrder = (items) =>
  [...items].sort((a, b) => Number(a.order) - Number(b.order))

const normalize = (item) => ({
  id: String(item.id),
  imageUrl: String(item.imageUrl || ''),
  imagePath: String(item.imagePath || ''),
  caption: String(item.caption || ''),
  order: Number(item.order) || 1,
})

const readLocal = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(raw?.items)) return sortByOrder(raw.items.map(normalize))
  } catch {
    /* ignore */
  }
  return []
}

const writeLocal = (items) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: sortByOrder(items) }))

const writerFields = async () => {
  const user = (await getFirebaseAuth())?.currentUser
  return user?.email || user?.uid ? { updatedBy: user.email || user.uid } : {}
}

export { isFirebaseConfigured }

/** Public + admin read. Throws on Firestore error when strict=true. */
export async function listStudioPhotos({ strict = false } = {}) {
  if (!isFirebaseConfigured()) return readLocal()
  try {
    const db = await getFirebaseDb()
    const { collection, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(collection(db, COLLECTION))
    return sortByOrder(snap.docs.map((d) => normalize({ ...d.data(), id: d.id })))
  } catch (error) {
    if (strict) throw error
    console.warn('Firestore studioPhotos read failed.', error)
    return []
  }
}

const newId = () =>
  `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export async function createStudioPhoto() {
  const items = await listStudioPhotos({ strict: true })
  const order = items.reduce((m, i) => Math.max(m, i.order), 0) + 1
  const item = normalize({ id: newId(), order })
  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(doc(db, COLLECTION, item.id), {
      imageUrl: '',
      caption: '',
      order,
      updatedAt: serverTimestamp(),
      ...(await writerFields()),
    })
    return item
  }
  writeLocal([...items, item])
  return item
}

export async function updateStudioPhoto(id, patch) {
  const next = {}
  if (patch.caption !== undefined) {
    next.caption = String(patch.caption).trim()
    if (next.caption.length > MAX_CAPTION) {
      throw new Error(`캡션은 ${MAX_CAPTION}자 이내여야 합니다.`)
    }
  }
  if (patch.order !== undefined) {
    const order = Math.round(Number(patch.order))
    if (!Number.isFinite(order) || order < 1) throw new Error('표시 순서는 1 이상이어야 합니다.')
    next.order = order
  }
  if (patch.imageUrl !== undefined) next.imageUrl = String(patch.imageUrl)
  if (patch.imagePath !== undefined) next.imagePath = String(patch.imagePath)

  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(
      doc(db, COLLECTION, id),
      { ...next, updatedAt: serverTimestamp(), ...(await writerFields()) },
      { merge: true },
    )
    return
  }
  writeLocal(readLocal().map((i) => (i.id === id ? normalize({ ...i, ...next }) : i)))
}

/** Batch reorder: [{ id, order }] */
export async function reorderStudioPhotos(pairs) {
  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    const { doc, writeBatch, serverTimestamp } = await import('firebase/firestore')
    const batch = writeBatch(db)
    const by = await writerFields()
    pairs.forEach(({ id, order }) =>
      batch.set(doc(db, COLLECTION, id), { order, updatedAt: serverTimestamp(), ...by }, { merge: true }),
    )
    await batch.commit()
    return
  }
  const map = new Map(pairs.map((p) => [p.id, p.order]))
  writeLocal(readLocal().map((i) => (map.has(i.id) ? { ...i, order: map.get(i.id) } : i)))
}

const deleteStorageObject = async (path) => {
  if (!path) return
  try {
    const storage = await getFirebaseStorage()
    const { ref, deleteObject } = await import('firebase/storage')
    await deleteObject(ref(storage, path))
  } catch (error) {
    if (error?.code !== 'storage/object-not-found') {
      console.warn('Studio image delete failed.', error)
    }
  }
}

export async function deleteStudioPhoto(photo) {
  if (isFirebaseConfigured()) {
    const db = await getFirebaseDb()
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, COLLECTION, photo.id))
    await deleteStorageObject(photo.imagePath)
    return
  }
  writeLocal(readLocal().filter((i) => i.id !== photo.id))
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
    reader.readAsDataURL(file)
  })

/** Upload/replace → studio/{id}.{ext}; removes the previous object if the extension changed. */
export async function uploadStudioPhoto(photo, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('JPG, PNG, WebP만 올릴 수 있습니다.')
  }
  if (file.size > MAX_BYTES) throw new Error('이미지는 8MB 이하여야 합니다.')
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'

  if (isFirebaseConfigured()) {
    const storage = await getFirebaseStorage()
    const { getDownloadURL, ref, uploadBytes } = await import('firebase/storage')
    const path = `studio/${photo.id}.${ext}`
    const fileRef = ref(storage, path)
    await uploadBytes(fileRef, file, { contentType: file.type })
    const imageUrl = await getDownloadURL(fileRef)
    await updateStudioPhoto(photo.id, { imageUrl, imagePath: path })
    if (photo.imagePath && photo.imagePath !== path) await deleteStorageObject(photo.imagePath)
    return { imageUrl, imagePath: path }
  }
  const imageUrl = await fileToDataUrl(file)
  await updateStudioPhoto(photo.id, { imageUrl })
  return { imageUrl, imagePath: '' }
}
