import './style.css'
import { listApps } from './data/apps-repository.js'
import { createPublicAppCard } from './apps-ui.js'

const toggle = document.querySelector('[data-menu-toggle]')
const panel = document.querySelector('[data-mobile-nav]')
const form = document.querySelector('[data-contact-form]')
const formStatus = document.querySelector('[data-form-status]')
const year = document.querySelector('[data-year]')
const appsGrid = document.querySelector('[data-apps-grid]')

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

const validityMessage = (input) => {
  if (input.validity.valueMissing) return '이 칸을 입력해 주세요.'
  if (input.validity.typeMismatch) return '올바른 이메일 주소를 입력해 주세요.'
  return ''
}

form?.querySelectorAll('input, textarea').forEach((input) => {
  input.addEventListener('invalid', () => {
    input.setCustomValidity(validityMessage(input))
  })
  input.addEventListener('input', () => {
    input.setCustomValidity('')
  })
})

form?.addEventListener('submit', (event) => {
  event.preventDefault()

  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  form.reset()
  if (formStatus) {
    formStatus.textContent =
      '작성해 주셔서 감사합니다. 실제 접수 기능은 아직 연결되지 않았습니다. 연락처를 입력해 주세요.'
  }
})

const renderApps = async () => {
  if (!appsGrid) return
  try {
    const apps = await listApps()
    appsGrid.replaceChildren(...apps.map((app) => createPublicAppCard(app)))
  } catch (error) {
    console.error(error)
    appsGrid.textContent = '앱 목록을 불러오지 못했습니다.'
  }
}

renderApps()
