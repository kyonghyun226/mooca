import './style.css'
import './admin.css'
import {
  isFirebaseConfigured,
  listStudioPhotos,
  createStudioPhoto,
  updateStudioPhoto,
  reorderStudioPhotos,
  deleteStudioPhoto,
  uploadStudioPhoto,
} from './data/studio-repository.js'
import { getFirebaseAuth } from './lib/firebase.js'

const listEl = document.querySelector('[data-admin-list]')
const emptyEl = document.querySelector('[data-studio-empty]')
const addBtns = document.querySelectorAll('[data-add-photo]')
const chipLabel = document.querySelector('[data-admin-chip-label]')
const authSection = document.querySelector('[data-admin-auth]')
const loginForm = document.querySelector('[data-admin-login]')
const loginStatus = document.querySelector('[data-admin-login-status]')

let photos = []
let canEdit = false
const pad = (n) => String(n).padStart(2, '0')

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const setThumb = (thumb, url) => {
  if (url) {
    const img = document.createElement('img')
    img.src = url
    img.alt = ''
    thumb.replaceChildren(img)
  } else {
    thumb.replaceChildren(el('span', 'admin-studio-thumb-empty', '미리보기'))
  }
}

const move = async (index, delta) => {
  const target = index + delta
  if (target < 0 || target >= photos.length) return
  const next = [...photos]
  ;[next[index], next[target]] = [next[target], next[index]]
  const pairs = next.map((p, i) => ({ id: p.id, order: i + 1 }))
  try {
    listEl.classList.add('is-busy')
    await reorderStudioPhotos(pairs)
    await renderList()
  } catch (error) {
    alert(error.message || '순서를 바꾸지 못했습니다.')
  } finally {
    listEl.classList.remove('is-busy')
  }
}

const createCard = (photo, index) => {
  const card = el('article', 'admin-studio-card')
  card.setAttribute('role', 'listitem')
  card.dataset.photoId = photo.id

  const top = el('div', 'admin-studio-card-top')
  top.append(el('span', 'admin-app-order', `Photo ${pad(index + 1)}`), el('span', 'admin-app-id', `id: ${photo.id}`))

  const body = el('div', 'admin-studio-body')
  const thumb = el('div', 'admin-studio-thumb')
  thumb.setAttribute('aria-hidden', 'true')
  setThumb(thumb, photo.imageUrl)

  const fields = el('div', 'admin-fields')

  const imgField = el('div', 'admin-field')
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/jpeg,image/png,image/webp'
  fileInput.hidden = true
  const uploadBtn = el('button', 'btn btn--ghost', photo.imageUrl ? '사진 교체' : '사진 업로드')
  uploadBtn.type = 'button'
  const actions = el('div', 'admin-icon-actions')
  actions.append(uploadBtn, el('span', 'admin-icon-note', 'JPG / PNG / WebP · 8MB 이하 · 권장 1600×1200'), fileInput)
  imgField.append(el('span', 'admin-label', '사진'), actions)

  const capField = el('div', 'admin-field')
  const capLabel = el('label', 'admin-label', '캡션 (선택)')
  const capInput = document.createElement('input')
  capInput.className = 'admin-input'
  capInput.id = capLabel.htmlFor = `caption-${photo.id}`
  capInput.type = 'text'
  capInput.maxLength = 60
  capInput.placeholder = '예: 스튜디오 내부'
  capInput.value = photo.caption
  capField.append(capLabel, capInput)

  const orderField = el('div', 'admin-field admin-field--order')
  const orderLabel = el('label', 'admin-label', '표시 순서')
  const orderInput = document.createElement('input')
  orderInput.className = 'admin-input admin-input--order'
  orderInput.id = orderLabel.htmlFor = `order-${photo.id}`
  orderInput.type = 'number'
  orderInput.min = '1'
  orderInput.value = String(photo.order)
  const orderRow = el('div', 'admin-order-row')
  const btns = el('div', 'admin-order-btns')
  const up = el('button', 'btn btn--ghost btn--icon', '↑')
  const down = el('button', 'btn btn--ghost btn--icon', '↓')
  up.type = down.type = 'button'
  up.setAttribute('aria-label', '순서 위로')
  down.setAttribute('aria-label', '순서 아래로')
  up.disabled = index === 0
  down.disabled = index === photos.length - 1
  btns.append(up, down)
  orderRow.append(orderInput, btns)
  orderField.append(orderLabel, orderRow)

  fields.append(imgField, capField, orderField)
  body.append(thumb, fields)

  const footer = el('div', 'admin-card-footer')
  const delBtn = el('button', 'btn btn--ghost btn--danger', '삭제')
  delBtn.type = 'button'
  const status = el('span', 'admin-save-status', '변경 사항 없음')
  const saveBtn = el('button', 'btn btn--primary btn--sm btn--save', '저장')
  saveBtn.type = 'button'
  footer.append(delBtn, status, saveBtn)

  card.append(top, body, footer)

  const markDirty = () => {
    status.textContent = '저장되지 않은 변경'
  }
  capInput.addEventListener('input', markDirty)
  orderInput.addEventListener('input', markDirty)
  up.addEventListener('click', () => move(index, -1))
  down.addEventListener('click', () => move(index, 1))

  uploadBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    try {
      uploadBtn.disabled = true
      status.textContent = '사진 올리는 중…'
      const saved = await uploadStudioPhoto(photo, file)
      Object.assign(photo, saved)
      setThumb(thumb, saved.imageUrl)
      uploadBtn.textContent = '사진 교체'
      status.textContent = '사진 저장됨'
    } catch (error) {
      status.textContent = error.message || '사진을 올리지 못했습니다.'
    } finally {
      uploadBtn.disabled = false
    }
  })

  saveBtn.addEventListener('click', async () => {
    try {
      saveBtn.disabled = true
      status.textContent = '저장 중…'
      const order = Math.round(Number(orderInput.value))
      await updateStudioPhoto(photo.id, { caption: capInput.value, order })
      if (order !== photo.order) {
        await renderList()
        return
      }
      photo.caption = capInput.value.trim()
      status.textContent = '저장됨'
    } catch (error) {
      status.textContent = error.message || '저장하지 못했습니다.'
    } finally {
      saveBtn.disabled = false
    }
  })

  delBtn.addEventListener('click', async () => {
    if (!confirm('이 사진을 삭제할까요? 공개 갤러리에서도 사라집니다.')) return
    try {
      delBtn.disabled = true
      status.textContent = '삭제 중…'
      await deleteStudioPhoto(photo)
      await renderList()
    } catch (error) {
      status.textContent = error.message || '삭제하지 못했습니다.'
      delBtn.disabled = false
    }
  })

  return card
}

const renderList = async () => {
  photos = await listStudioPhotos({ strict: true })
  listEl.replaceChildren(...photos.map((p, i) => createCard(p, i)))
  emptyEl.hidden = photos.length > 0
}

const setEditable = (on) => {
  canEdit = on
  addBtns.forEach((b) => {
    b.hidden = !on
  })
  if (!on) {
    listEl.replaceChildren()
    emptyEl.hidden = true
  }
}

addBtns.forEach((btn) =>
  btn.addEventListener('click', async () => {
    if (!canEdit) return
    try {
      btn.disabled = true
      await createStudioPhoto()
      await renderList()
      listEl.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (error) {
      alert(error.message || '사진을 추가하지 못했습니다.')
    } finally {
      btn.disabled = false
    }
  }),
)

const showError = (error) => {
  listEl.replaceChildren(el('p', 'admin-save-status', error.message || '목록을 불러오지 못했습니다.'))
}

const bootLocal = async () => {
  chipLabel.textContent = '로컬'
  authSection.hidden = true
  setEditable(true)
  await renderList().catch(showError)
}

const bootFirebase = async () => {
  const auth = await getFirebaseAuth()
  if (!auth) return bootLocal()
  const { onAuthStateChanged, signInWithEmailAndPassword } = await import('firebase/auth')

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      chipLabel.textContent = '로그인 필요'
      authSection.hidden = false
      setEditable(false)
      return
    }
    chipLabel.textContent = user.email || '관리자'
    authSection.hidden = true
    setEditable(true)
    await renderList().catch(showError)
  })

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(loginForm)
    try {
      loginStatus.textContent = '로그인 중…'
      await signInWithEmailAndPassword(auth, String(data.get('email')), String(data.get('password')))
    } catch (error) {
      loginStatus.textContent = error.message || '로그인하지 못했습니다.'
    }
  })
}

setEditable(false)
if (isFirebaseConfigured()) bootFirebase()
else bootLocal()
