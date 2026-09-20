import './admin.css'
import {
  isFirebaseConfigured,
  getFirebaseAuth,
} from './lib/firebase.js'
import {
  listShopItems,
  createShopItem,
  deleteShopItem,
  uploadShopImage,
} from './data/shop-repository.js'

const listEl = document.querySelector('[data-admin-list]')
const authSection = document.querySelector('[data-admin-auth]')
const loginForm = document.querySelector('[data-admin-login]')
const loginStatus = document.querySelector('[data-admin-login-status]')
const chipLabel = document.querySelector('[data-admin-chip-label]')
const addBtn = document.querySelector('[data-shop-add]')

const setStatus = (el, text) => {
  if (el) el.textContent = text
}

const createCard = (item) => {
  const card = document.createElement('article')
  card.className = 'admin-card'
  card.dataset.shopId = item.id
  card.setAttribute('role', 'listitem')

  const top = document.createElement('div')
  top.className = 'admin-card-top'
  const title = document.createElement('h2')
  title.className = 'admin-card-title'
  title.textContent = `굿즈 ${String(item.order).padStart(2, '0')}`
  top.append(title)

  const preview = document.createElement('div')
  preview.className = 'admin-icon-preview admin-shop-preview'
  if (item.imageUrl) {
    const img = document.createElement('img')
    img.src = item.imageUrl
    img.alt = ''
    preview.append(img)
  } else {
    preview.textContent = '이미지 없음'
  }

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/jpeg,image/png,image/webp'
  fileInput.hidden = true

  const uploadBtn = document.createElement('button')
  uploadBtn.type = 'button'
  uploadBtn.className = 'btn btn--ghost'
  uploadBtn.textContent = '이미지 업로드'

  const deleteBtn = document.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'btn btn--ghost'
  deleteBtn.textContent = '삭제'

  const status = document.createElement('span')
  status.className = 'admin-save-status'
  status.textContent = item.imageUrl ? '준비됨' : '이미지를 올려 주세요'

  const actions = document.createElement('div')
  actions.className = 'admin-icon-actions'
  actions.append(uploadBtn, deleteBtn, fileInput)

  const footer = document.createElement('div')
  footer.className = 'admin-card-footer'
  footer.append(status, actions)

  card.append(top, preview, footer)

  uploadBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    try {
      status.textContent = '올리는 중…'
      const saved = await uploadShopImage(item.id, file)
      preview.replaceChildren()
      const img = document.createElement('img')
      img.src = saved.imageUrl
      img.alt = ''
      preview.append(img)
      status.textContent = '저장됨'
    } catch (error) {
      status.textContent = error.message || '업로드하지 못했습니다.'
    }
  })

  deleteBtn.addEventListener('click', async () => {
    if (!confirm('이 굿즈 이미지를 삭제할까요?')) return
    try {
      status.textContent = '삭제 중…'
      await deleteShopItem(item.id)
      await renderList()
    } catch (error) {
      status.textContent = error.message || '삭제하지 못했습니다.'
    }
  })

  return card
}

const renderList = async () => {
  const items = await listShopItems()
  if (!items.length) {
    const empty = document.createElement('p')
    empty.className = 'admin-page-help'
    empty.textContent = '아직 굿즈가 없습니다. 「굿즈 추가」로 프레임을 만드세요.'
    listEl.replaceChildren(empty)
    return
  }
  listEl.replaceChildren(...items.map((item) => createCard(item)))
}

addBtn?.addEventListener('click', async () => {
  try {
    addBtn.disabled = true
    addBtn.textContent = '추가 중…'
    await createShopItem()
    await renderList()
  } catch (error) {
    alert(error.message || '추가하지 못했습니다.')
  } finally {
    addBtn.disabled = false
    addBtn.textContent = '굿즈 추가'
  }
})

const bootLocal = async () => {
  setStatus(chipLabel, '로컬')
  authSection.hidden = true
  await renderList()
}

const bootFirebase = async () => {
  const auth = await getFirebaseAuth()
  if (!auth) {
    await bootLocal()
    return
  }
  const { onAuthStateChanged, signInWithEmailAndPassword } = await import('firebase/auth')
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setStatus(chipLabel, '로그인 필요')
      authSection.hidden = false
      listEl.replaceChildren()
      return
    }
    setStatus(chipLabel, user.email || '관리자')
    authSection.hidden = true
    await renderList()
  })
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const data = new FormData(loginForm)
    try {
      loginStatus.textContent = '로그인 중…'
      await signInWithEmailAndPassword(
        auth,
        String(data.get('email')),
        String(data.get('password')),
      )
    } catch (error) {
      loginStatus.textContent = error.message || '로그인하지 못했습니다.'
    }
  })
}

if (isFirebaseConfigured()) bootFirebase()
else bootLocal()
