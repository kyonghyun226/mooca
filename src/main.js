import './style.css'
import { listApps } from './data/apps-repository.js'
import { createPublicAppRow } from './apps-ui.js'

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
