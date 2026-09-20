import './style.css'
import { listApps } from './data/apps-repository.js'
import { createPublicAppRow } from './apps-ui.js'
import { listShopItems } from './data/shop-repository.js'

const toggle = document.querySelector('[data-menu-toggle]')
const panel = document.querySelector('[data-mobile-nav]')
const year = document.querySelector('[data-year]')
const appsIndex = document.querySelector('[data-apps-index]')
const appsCount = document.querySelector('[data-apps-count]')

if (year) {
  year.textContent = String(new Date().getFullYear())
}

const setMenuOpen = (open) => {
  if (!toggle || !panel) return
  toggle.setAttribute('aria-expanded', String(open))
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기')
  panel.hidden = !open
  document.body.classList.toggle('is-menu-open', open)
}

toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true'
  setMenuOpen(!expanded)
})

panel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false))
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false)
})

const renderApps = async () => {
  if (!appsIndex) return
  try {
    const apps = await listApps()
    appsIndex.replaceChildren(...apps.map((app, i) => createPublicAppRow(app, i)))
    if (appsCount) {
      appsCount.textContent = String(apps.length).padStart(2, '0')
    }
  } catch (error) {
    console.error(error)
    appsIndex.textContent = '앱 목록을 불러오지 못했습니다.'
  }
}

renderApps()


const shopGrid = document.querySelector('[data-shop-grid]')

const renderShop = async () => {
  if (!shopGrid) return
  try {
    const items = await listShopItems()
    if (!items.length) {
      shopGrid.innerHTML = ''
      for (let i = 0; i < 6; i += 1) {
        const card = document.createElement('article')
        card.className = 'pub-shop-card'
        card.setAttribute('role', 'listitem')
        const frame = document.createElement('div')
        frame.className = 'frame'
        frame.setAttribute('aria-hidden', 'true')
        const mark = document.createElement('span')
        mark.className = 'frame-mark'
        mark.textContent = String(i + 1).padStart(2, '0')
        frame.append(mark)
        card.append(frame)
        shopGrid.append(card)
      }
      return
    }
    shopGrid.replaceChildren(
      ...items.map((item, index) => {
        const card = document.createElement('article')
        card.className = 'pub-shop-card'
        card.setAttribute('role', 'listitem')
        const frame = document.createElement('div')
        frame.className = 'frame'
        if (item.imageUrl) {
          const img = document.createElement('img')
          img.src = item.imageUrl
          img.alt = ''
          img.loading = 'lazy'
          frame.append(img)
        } else {
          const mark = document.createElement('span')
          mark.className = 'frame-mark'
          mark.textContent = String(index + 1).padStart(2, '0')
          frame.append(mark)
        }
        card.append(frame)
        return card
      }),
    )
  } catch (error) {
    console.error(error)
    shopGrid.textContent = '굿즈를 불러오지 못했습니다.'
  }
}

renderShop()
