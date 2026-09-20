import './style.css'
import './admin.css'
import { fillIcon } from './apps-ui.js'
import {
  isFirebaseConfigured,
  listApps,
  updateApp,
  uploadIcon,
  uploadAppMockup,
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

const createField = (labelText, input, hintText) => {
  const wrap = document.createElement('div')
  wrap.className = 'admin-field'
  const label = document.createElement('label')
  label.className = 'admin-label'
  label.htmlFor = input.id
  label.textContent = labelText
  wrap.append(label, input)
  if (hintText) {
    const hint = document.createElement('p')
    hint.className = 'admin-hint'
    hint.textContent = hintText
    wrap.append(hint)
  }
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
  urlRow.append(
    createField('App Store URL', iosInput),
    createField('Google Play URL', playInput),
  )

  const taglineInput = document.createElement('input')
  taglineInput.className = 'admin-input'
  taglineInput.id = `tagline-${app.id}`
  taglineInput.type = 'text'
  taglineInput.maxLength = 60
  taglineInput.value = app.tagline || ''

  const bodyInput = document.createElement('textarea')
  bodyInput.className = 'admin-input admin-textarea--lg'
  bodyInput.id = `body-${app.id}`
  bodyInput.rows = 5
  bodyInput.maxLength = 600
  bodyInput.value = app.body || ''

  const featureInputs = [0, 1, 2].map((i) => {
    const input = document.createElement('input')
    input.className = 'admin-input'
    input.id = `feature-${app.id}-${i}`
    input.type = 'text'
    input.maxLength = 60
    input.value = app.features?.[i] || ''
    return input
  })

  const featuresFieldset = document.createElement('fieldset')
  featuresFieldset.className = 'admin-fieldset'
  const featuresLegend = document.createElement('legend')
  featuresLegend.className = 'admin-label'
  featuresLegend.textContent = '주요 기능 (3)'
  featuresFieldset.append(featuresLegend)
  featureInputs.forEach((input, i) => {
    featuresFieldset.append(
      createField(`기능 ${String(i + 1).padStart(2, '0')}`, input),
    )
  })

  const mockSlots = [0, 1, 2].map((i) => {
    const slot = document.createElement('div')
    slot.className = 'admin-mockup-slot'
    const previewEl = document.createElement('div')
    previewEl.className = 'admin-mockup-preview'
    const url = app.mockupUrls?.[i]
    if (url) {
      const img = document.createElement('img')
      img.src = url
      img.alt = ''
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
      previewEl.replaceChildren(img)
    } else {
      previewEl.textContent = String(i + 1)
    }
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn--ghost'
    btn.textContent = '업로드'
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.hidden = true
    btn.addEventListener('click', () => input.click())
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      try {
        status.textContent = `목업 ${i + 1} 올리는 중…`
        const saved = await uploadAppMockup(app.id, file, i)
        app.mockupUrls = saved.mockupUrls
        const nextUrl = saved.mockupUrls?.[i]
        if (nextUrl) {
          const img = document.createElement('img')
          img.src = nextUrl
          img.alt = ''
          img.style.cssText =
            'width:100%;height:100%;object-fit:cover;display:block;'
          previewEl.replaceChildren(img)
        }
        status.textContent = '목업 저장됨'
        markDirty()
      } catch (error) {
        status.textContent = error.message || '목업을 올리지 못했습니다.'
      }
    })
    slot.append(previewEl, btn, input)
    return slot
  })

  const mockupField = document.createElement('div')
  mockupField.className = 'admin-field'
  const mockLabel = document.createElement('span')
  mockLabel.className = 'admin-label'
  mockLabel.textContent = '목업 이미지 (1–3)'
  const mockHint = document.createElement('p')
  mockHint.className = 'admin-hint'
  mockHint.textContent = 'PNG / WebP · 권장 9:16 · storage: apps/' + app.id + '/mockups/'
  const mockGrid = document.createElement('div')
  mockGrid.className = 'admin-mockup-grid'
  mockGrid.append(...mockSlots)
  mockupField.append(mockLabel, mockHint, mockGrid)

  const captionInputs = [0, 1, 2].map((i) => {
    const input = document.createElement('input')
    input.className = 'admin-input'
    input.id = `cap-${app.id}-${i}`
    input.type = 'text'
    input.maxLength = 40
    input.placeholder = `캡션 ${i + 1}`
    input.value = app.galleryCaptions?.[i] || ''
    return input
  })
  const captionRow = document.createElement('div')
  captionRow.className = 'admin-field-row admin-field-row--3'
  captionInputs.forEach((input, i) => {
    captionRow.append(createField(`갤러리 캡션 ${i + 1}`, input))
  })

  const previewLink = document.createElement('p')
  previewLink.className = 'admin-detail-preview-link'
  const previewA = document.createElement('a')
  previewA.href = `/apps/${app.id}`
  previewA.target = '_blank'
  previewA.rel = 'noopener noreferrer'
  previewA.textContent = `공개 미리보기: /apps/${app.id}`
  previewLink.append(document.createTextNode('공개 미리보기: '), previewA)

  const details = document.createElement('details')
  details.className = 'admin-detail-acc'
  const summary = document.createElement('summary')
  summary.className = 'admin-detail-summary'
  summary.append(document.createTextNode('상세 페이지'))
  const summaryHint = document.createElement('span')
  summaryHint.className = 'admin-detail-hint'
  summaryHint.textContent = '태그라인 · 소개 · 기능 · 목업'
  summary.append(summaryHint)
  const panel = document.createElement('div')
  panel.className = 'admin-detail-panel'
  panel.append(
    createField('상세 태그라인', taglineInput, '권장 24자 이내 · 상세 히어로'),
    createField('소개 (본문)', bodyInput, '최대 600자'),
    featuresFieldset,
    mockupField,
    captionRow,
    previewLink,
  )
  details.append(summary, panel)

  const fields = document.createElement('div')
  fields.className = 'admin-fields'
  fields.append(
    createField('앱 이름', nameInput),
    createField('한 줄 소개', descInput, '공개 카드 원라이너 (권장 40자 이내)'),
    iconField,
    urlRow,
    details,
  )

  const footer = document.createElement('div')
  footer.className = 'admin-app-card-foot'
  const status = document.createElement('p')
  status.className = 'admin-save-status'
  status.textContent = '변경 사항 없음'
  const saveBtn = document.createElement('button')
  saveBtn.type = 'button'
  saveBtn.className = 'btn btn--ink btn--save'
  saveBtn.textContent = '저장'
  footer.append(status, saveBtn)

  card.append(top, fields, footer)

  const markDirty = () => {
    status.textContent = '저장되지 않은 변경'
    status.style.color = 'var(--ink-soft)'
    saveBtn.textContent = '저장'
  }

  ;[
    nameInput,
    descInput,
    iosInput,
    playInput,
    taglineInput,
    bodyInput,
    ...featureInputs,
    ...captionInputs,
  ].forEach((input) => input.addEventListener('input', markDirty))

  uploadBtn.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    try {
      status.textContent = '아이콘 올리는 중…'
      const saved = await uploadIcon(app.id, file)
      fillIcon(preview, saved)
      app.iconUrl = saved.iconUrl
      status.textContent = '아이콘 저장됨'
    } catch (error) {
      status.textContent = error.message || '아이콘을 올리지 못했습니다.'
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
        tagline: taglineInput.value,
        body: bodyInput.value,
        features: featureInputs.map((input) => input.value.trim()).filter(Boolean),
        galleryCaptions: captionInputs.map((input) => input.value.trim()),
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
