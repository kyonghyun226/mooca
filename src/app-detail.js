import './style.css'
import { getApp } from './data/apps-repository.js'
import { fillIcon } from './apps-ui.js'

const root = document.querySelector('[data-app-detail]')

const EN_NAME = {
  seesaw: 'Seesaw',
  pooptime: 'Pooptime',
  randomdrop: 'Randomdrop',
  banjjak: 'Banjjak',
  ieum: 'Ieum',
}

const slugFromPath = () => {
  const parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts[0] === 'apps' && parts[1] && parts[1] !== 'detail.html') {
    return parts[1]
  }
  return new URLSearchParams(location.search).get('id') || ''
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

const storeCtas = (app, solidClass, ghostClass) => {
  const wrap = el('div', 'app-detail-ctas')
  const ios = app.appStoreUrl?.trim()
  const play = app.googlePlayUrl?.trim()
  const iosA = el('a', solidClass, 'App Store')
  if (ios) {
    iosA.href = ios
    iosA.target = '_blank'
    iosA.rel = 'noopener noreferrer'
  } else {
    iosA.href = '#'
    iosA.setAttribute('aria-disabled', 'true')
  }
  const playA = el('a', ghostClass, 'Google Play')
  if (play) {
    playA.href = play
    playA.target = '_blank'
    playA.rel = 'noopener noreferrer'
  } else {
    playA.href = '#'
    playA.setAttribute('aria-disabled', 'true')
  }
  wrap.append(iosA, playA)
  return wrap
}

const phoneFrame = (modifier, url, label, sub) => {
  const frame = el('div', `phone-frame phone-frame--${modifier}`)
  const bezel = el('div', 'phone-bezel')
  bezel.append(el('span', 'phone-notch'))
  const screen = el('div', 'phone-screen')
  if (url) {
    const img = document.createElement('img')
    img.src = url
    img.alt = ''
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:0.85rem;position:absolute;inset:0;'
    screen.style.position = 'relative'
    screen.append(img)
  } else {
    screen.append(el('span', 'frame-mark', modifier === 'a' ? 'A' : 'B'))
    screen.append(el('p', 'phone-screen-label', label))
    screen.append(el('p', 'phone-screen-sub', sub))
  }
  bezel.append(screen)
  frame.append(bezel)
  return frame
}

const render = async () => {
  const id = slugFromPath()
  if (!id) {
    root.textContent = '앱을 찾을 수 없습니다.'
    return
  }
  const app = await getApp(id)
  if (!app) {
    root.textContent = '앱을 찾을 수 없습니다.'
    return
  }

  document.title = `${app.name} — MOOCA Apps`
  const en = EN_NAME[app.id] || app.id
  const order = String(app.order ?? 1).padStart(2, '0')
  const features = (app.features?.length ? app.features : ['', '', '']).slice(0, 3)
  while (features.length < 3) features.push('')
  const mocks = app.mockupUrls || []
  const caps = app.galleryCaptions || []

  const crumb = el('div', 'container app-detail-crumb')
  const back = el('a', 'app-back', '← 앱 목록으로')
  back.href = '/#apps'
  crumb.append(back, el('span', 'app-detail-crumb-meta', `App ${order} · ${en}`))

  const hero = el('section', 'app-detail-hero')
  hero.setAttribute('aria-labelledby', 'app-heading')
  const heroGrid = el('div', 'container app-detail-hero-grid')
  const copy = el('div', 'app-detail-hero-copy')
  copy.append(el('p', 'micro-label', `Apps · ${en}`))
  const icon = el('div', 'app-detail-icon')
  icon.setAttribute('aria-hidden', 'true')
  fillIcon(icon, app)
  copy.append(icon)
  const h1 = el('h1', 'app-detail-name', app.name)
  h1.id = 'app-heading'
  copy.append(h1)
  copy.append(el('p', 'app-detail-tagline', app.tagline || app.description))
  copy.append(el('p', 'app-detail-oneliner', app.description))
  if (app.tags?.length) {
    copy.append(el('p', 'app-tags app-detail-tags', app.tags.join(' · ')))
  }
  copy.append(storeCtas(app, 'btn btn--ink', 'btn btn--ghost-ink'))
  if (!app.appStoreUrl?.trim() && !app.googlePlayUrl?.trim()) {
    copy.append(el('p', 'app-detail-temp', '플레이스홀더 · 스토어 URL은 어드민에서 교체'))
  }

  const phones = el('div', 'app-detail-phones')
  phones.setAttribute('aria-hidden', 'true')
  phones.append(
    phoneFrame('a', mocks[0], app.name, 'Mockup 01'),
    phoneFrame('b', mocks[1], caps[1] || '화면', 'Mockup 02'),
  )
  heroGrid.append(copy, phones)
  hero.append(heroGrid)

  const bodySec = el('section', 'section app-detail-body')
  bodySec.setAttribute('aria-labelledby', 'intro-heading')
  const bodyGrid = el('div', 'container app-detail-body-grid')
  const intro = document.createElement('div')
  intro.append(el('p', 'micro-label', '소개'))
  const introH = el('h2', 'block-title')
  introH.id = 'intro-heading'
  introH.innerHTML = '이 앱은<br /><em>이런</em> 서비스입니다'
  intro.append(introH)
  intro.append(el('p', 'app-detail-body-text', app.body || app.description))
  const featCol = document.createElement('div')
  featCol.append(el('p', 'micro-label', '주요 기능'))
  const featH = el('h2', 'block-title')
  featH.innerHTML = '핵심만<br /><em>세 가지</em>'
  featCol.append(featH)
  const ol = el('ol', 'app-feature-list')
  features.forEach((text, i) => {
    const li = el('li', 'app-feature-item')
    li.append(el('span', 'app-feature-no', String(i + 1).padStart(2, '0')))
    li.append(el('p', 'app-feature-text', text || `임시 기능 ${i + 1}`))
    ol.append(li)
  })
  featCol.append(ol)
  bodyGrid.append(intro, featCol)
  bodySec.append(bodyGrid)

  const gallery = el('section', 'section app-detail-gallery')
  gallery.setAttribute('aria-labelledby', 'gallery-heading')
  const gInner = el('div', 'container')
  const head = el('div', 'block-head block-head--split')
  const headL = document.createElement('div')
  headL.append(el('span', 'micro-label', 'Gallery'))
  const gH = el('h2', 'block-title', '화면 미리보기')
  gH.id = 'gallery-heading'
  headL.append(gH)
  head.append(headL)
  head.append(
    el(
      'p',
      'block-note',
      mocks.length
        ? '어드민에서 올린 목업입니다.'
        : '임시 프레임입니다. 어드민에서 목업 이미지를 업로드하면 교체됩니다.',
    ),
  )
  const ul = el('ul', 'app-gallery-grid')
  ul.setAttribute('role', 'list')
  for (let i = 0; i < 3; i++) {
    const li = el('li', 'app-gallery-item')
    li.setAttribute('role', 'listitem')
    if (mocks[i]) {
      const fig = el('div', 'frame app-gallery-frame')
      const img = document.createElement('img')
      img.src = mocks[i]
      img.alt = caps[i] || `${app.name} 화면 ${i + 1}`
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
      fig.append(img)
      li.append(fig)
    } else {
      const frame = el('div', 'frame app-gallery-frame')
      frame.setAttribute('aria-hidden', 'true')
      frame.append(el('span', 'frame-mark', String(i + 1).padStart(2, '0')))
      li.append(frame)
    }
    const cap = el('p', 'app-gallery-cap')
    const em = document.createElement('em')
    em.textContent = String(i + 1).padStart(2, '0')
    cap.append(em, document.createTextNode(` ${caps[i] || `화면 ${i + 1}`}`))
    li.append(cap)
    ul.append(li)
  }
  gInner.append(head, ul)
  gallery.append(gInner)

  const cta = el('section', 'cta-band pub-cta app-detail-cta')
  cta.setAttribute('aria-labelledby', 'detail-cta')
  const ctaGrid = el('div', 'container cta-grid')
  ctaGrid.append(el('p', 'micro-label micro-label--on-ink', 'Download'))
  const ctaTitle = el('h2', 'cta-title')
  ctaTitle.id = 'detail-cta'
  ctaTitle.innerHTML = `${app.name}을<br /><em>스토어에서</em> 만나 보세요`
  ctaGrid.append(ctaTitle)
  const actions = el('div', 'hero-actions')
  const ios = app.appStoreUrl?.trim()
  const play = app.googlePlayUrl?.trim()
  const a1 = el('a', 'btn btn--paper', 'App Store')
  a1.href = ios || '#'
  if (ios) {
    a1.target = '_blank'
    a1.rel = 'noopener noreferrer'
  } else a1.setAttribute('aria-disabled', 'true')
  const a2 = el('a', 'text-link text-link--on-ink', 'Google Play')
  a2.href = play || '#'
  if (play) {
    a2.target = '_blank'
    a2.rel = 'noopener noreferrer'
  } else a2.setAttribute('aria-disabled', 'true')
  actions.append(a1, a2)
  ctaGrid.append(actions)
  const backWrap = el('p', 'app-detail-cta-back')
  const back2 = el('a', 'text-link text-link--on-ink', '← 다른 앱 보기')
  back2.href = '/#apps'
  backWrap.append(back2)
  ctaGrid.append(backWrap)
  cta.append(ctaGrid)

  root.replaceChildren(crumb, hero, bodySec, gallery, cta)
}

render()
