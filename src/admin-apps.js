import './style.css'
import './admin.css'
import { fillIcon } from './apps-ui.js'
import {
  isFirebaseConfigured,
  listApps,
  updateApp,
  uploadIcon,
} from './data/apps-repository.js'
import { getFirebaseAuth } from './lib/firebase.js'

const listEl = document.querySelector('[data-admin-list]')
const chipLabel = document.querySelector('[data-admin-chip-label]')
const authSection = document.querySelector('[data-admin-auth]')
const loginForm = document.querySelector('[data-admin-login]')
const loginStatus = document.querySelector('[data-admin-login-status]')

const padOrder = (order) => String(order).padStart(2, '0')

const setStatus = (el, text) => {
  if (el) el.textContent = text
}

const createField = (labelText, input) => {
  const wrap = document.createElement('div')
  wrap.className = 'admin-field'
  const label = document.createElement('label')
  label.className = 'admin-label'
  label.htmlFor = input.id
  label.textContent = labelText
  wrap.append(label, input)
  return wrap
}

const createCard = (app) => {
  const card = document.createElement('article')
  card.className = 'admin-app-card'
  card.role = 'listitem'
  card.dataset.appId = app.id

  const top = document.createElement('div')
  top.className = 'admin-app-card-top'
  const order = document.createElement('span')
  order.className = 'admin-app-order'
  order.textContent = `App ${padOrder(app.order)}`
  const idLabel = document.createElement('span')
  idLabel.className = 'admin-app-id'
  idLabel.textContent = `id: ${app.id}`
  top.append(order, idLabel)

  const nameInput = document.createElement('input')
  nameInput.className = 'admin-input'
  nameInput.id = `name-${app.id}`
  nameInput.type = 'text'
  nameInput.maxLength = 40
  nameInput.value = app.name

  const descInput = document.createElement('input')
  descInput.className = 'admin-input'
  descInput.id = `desc-${app.id}`
  descInput.type = 'text'
  descInput.maxLength = 80
  descInput.value = app.description

  const descField = createField('한 줄 소개', descInput)
  const hint = document.createElement('p')
  hint.className = 'admin-hint'
  hint.textContent = '공개 카드에 표시되는 원라이너 (권장 40자 이내)'
  descField.append(hint)

  const preview = document.createElement('div')
  preview.className = 'admin-icon-preview'
  preview.setAttribute('aria-hidden', 'true')
  fillIcon(preview, app)

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/png,image/svg+xml,image/webp'
  fileInput.hidden = true

  const uploadBtn = document.createElement('button')
  uploadBtn.type = 'button'
  uploadBtn.className = 'btn btn--ghost'
  uploadBtn.textContent = '아이콘 업로드'

  const iconNote = document.createElement('span')
  iconNote.className = 'admin-icon-note'
  iconNote.textContent = 'PNG / SVG · 권장 512×512'

  const iconActions = document.createElement('div')
  iconActions.className = 'admin-icon-actions'
  iconActions.append(uploadBtn, iconNote, fileInput)

  const iconRow = document.createElement('div')
  iconRow.className = 'admin-icon-row'
  iconRow.append(preview, iconActions)

  const iconField = document.createElement('div')
  iconField.className = 'admin-field'
  const iconLabel = document.createElement('span')
  iconLabel.className = 'admin-label'
  iconLabel.id = `icon-label-${app.id}`
  iconLabel.textContent = '아이콘'
  iconRow.setAttribute('aria-labelledby', iconLabel.id)
  iconField.append(iconLabel, iconRow)

  const iosInput = document.createElement('input')
  iosInput.className = 'admin-input'
  iosInput.id = `ios-${app.id}`
  iosInput.type = 'url'
  iosInput.placeholder = 'https://apps.apple.com/…'
  iosInput.value = app.appStoreUrl || ''

  const playInput = document.createElement('input')
  playInput.className = 'admin-input'
  playInput.id = `aos-${app.id}`
  playInput.type = 'url'
  playInput.placeholder = 'https://play.google.com/store/apps/…'
  playInput.value = app.googlePlayUrl || ''

  const urlRow = document.createElement('div')
  urlRow.className = 'admin-field-row'
  urlRow.append(createField('App Store URL', iosInput), createField('Google Play URL', playInput))

  const fields = document.createElement('div')
  fields.className = 'admin-fields'
  fields.append(createField('앱 이름', nameInput), descField, iconField, urlRow)

  const footer = document.createElement('div')
  footer.className = 'admin-card-footer'
  const status = document.createElement('span')
  status.className = 'admin-save-status'
  status.textContent = '변경 사항 없음'
  const saveBtn = document.createElement('button')
  saveBtn.type = 'button'
  saveBtn.className = 'btn btn--primary btn--sm btn--save'
  saveBtn.textContent = '저장'
  footer.append(status, saveBtn)

  card.append(top, fields, footer)

  const markDirty = () => {
    status.textContent = '저장되지 않은 변경'
    status.style.color = 'var(--ink-soft)'
  }

  ;[nameInput, descInput, iosInput, playInput].forEach((input) => {
    input.addEventListener('input', markDirty)
  })

  uploadBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    try {
      status.textContent = '아이콘 올리는 중…'
      const saved = await uploadIcon(app.id, file)
      fillIcon(preview, saved)
      status.textContent = '아이콘 저장됨'
      status.style.color = 'var(--ink-muted)'
    } catch (error) {
      status.textContent = error.message || '아이콘을 올리지 못했습니다.'
      status.style.color = 'var(--ink-soft)'
    }
  })

  saveBtn.addEventListener('click', async () => {
    try {
      saveBtn.disabled = true
      saveBtn.textContent = '저장 중…'
      status.textContent = '저장 중…'
      await updateApp(app.id, {
        name: nameInput.value,
        description: descInput.value,
        appStoreUrl: iosInput.value,
        googlePlayUrl: playInput.value,
      })
      status.textContent = '저장됨'
      status.style.color = 'var(--ink-muted)'
      saveBtn.textContent = '저장됨'
      setTimeout(() => {
        saveBtn.textContent = '저장'
      }, 1200)
    } catch (error) {
      status.textContent = error.message || '저장하지 못했습니다.'
      status.style.color = 'var(--ink-soft)'
      saveBtn.textContent = '저장'
    } finally {
      saveBtn.disabled = false
    }
  })

  return card
}

const renderList = async () => {
  const apps = await listApps()
  listEl.replaceChildren(...apps.map((app) => createCard(app)))
}

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

  const { onAuthStateChanged, signInWithEmailAndPassword } = await import(
    'firebase/auth'
  )

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

if (isFirebaseConfigured()) {
  bootFirebase()
} else {
  bootLocal()
}
