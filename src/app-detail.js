import './style.css'
import { getApp } from './data/apps-repository.js'
import { fillIcon } from './apps-ui.js'

const root = document.querySelector('[data-app-detail]')

const slugFromPath = () => {
  const parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  // /apps/:slug or /apps/detail.html?id=
  if (parts[0] === 'apps' && parts[1] && parts[1] !== 'detail.html') {
    return parts[1]
  }
  return new URLSearchParams(location.search).get('id') || ''
}

const storeButtons = (app) => {
  const wrap = document.createElement('div')
  wrap.className = 'hero-actions app-detail-actions'
  const ios = app.appStoreUrl?.trim()
  const play = app.googlePlayUrl?.trim()
  if (ios) {
    const a = document.createElement('a')
    a.className = 'btn btn--ink'
    a.href = ios
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.textContent = 'App Store'
    wrap.append(a)
  }
  if (play) {
    const a = document.createElement('a')
    a.className = 'btn btn--ink'
    a.href = play
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.textContent = 'Google Play'
    wrap.append(a)
  }
  const back = document.createElement('a')
  back.className = 'text-link'
  back.href = '/#apps'
  back.textContent = '앱 목록으로'
  wrap.append(back)
  return wrap
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

  document.title = `${app.name} — MOOCA`

  const hero = document.createElement('section')
  hero.className = 'app-detail-hero'
  const container = document.createElement('div')
  container.className = 'container'

  const eyebrow = document.createElement('p')
  eyebrow.className = 'micro-label'
  eyebrow.textContent = 'App · 상세'

  const titleRow = document.createElement('div')
  titleRow.className = 'app-detail-title-row'
  const icon = document.createElement('div')
  icon.className = 'app-detail-icon'
  icon.setAttribute('aria-hidden', 'true')
  fillIcon(icon, app)
  const titles = document.createElement('div')
  const h1 = document.createElement('h1')
  h1.className = 'display-title'
  h1.textContent = app.name
  const tagline = document.createElement('p')
  tagline.className = 'app-detail-tagline'
  tagline.textContent = app.tagline || app.description
  titles.append(h1, tagline)
  titleRow.append(icon, titles)

  const body = document.createElement('p')
  body.className = 'app-detail-body'
  body.textContent = app.body || app.description

  container.append(eyebrow, titleRow, body, storeButtons(app))
  hero.append(container)

  const mock = document.createElement('section')
  mock.className = 'app-detail-mockups container'
  const mockHead = document.createElement('h2')
  mockHead.className = 'block-title'
  mockHead.textContent = '미리보기'
  const grid = document.createElement('div')
  grid.className = 'app-detail-mock-grid'
  const urls = app.mockupUrls?.length
    ? app.mockupUrls
    : [null, null] // temporary empty frames
  urls.forEach((url, i) => {
    const fig = document.createElement('figure')
    fig.className = 'app-detail-mock'
    if (url) {
      const img = document.createElement('img')
      img.src = url
      img.alt = `${app.name} 목업 ${i + 1}`
      fig.append(img)
    } else {
      const frame = document.createElement('div')
      frame.className = 'frame'
      const mark = document.createElement('span')
      mark.className = 'frame-mark'
      mark.textContent = String(i + 1).padStart(2, '0')
      frame.append(mark)
      fig.append(frame)
    }
    grid.append(fig)
  })
  mock.append(mockHead, grid)

  const features = document.createElement('section')
  features.className = 'app-detail-features container'
  const fHead = document.createElement('h2')
  fHead.className = 'block-title'
  fHead.textContent = '주요 기능'
  const list = document.createElement('ul')
  list.className = 'app-detail-feature-list'
  ;(app.features?.length ? app.features : ['임시 기능 안내 1', '임시 기능 안내 2', '임시 기능 안내 3']).forEach(
    (text) => {
      const li = document.createElement('li')
      li.textContent = text
      list.append(li)
    },
  )
  features.append(fHead, list)

  root.replaceChildren(hero, mock, features)
}

render()
