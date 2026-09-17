import './style.css'

const header = document.querySelector('[data-header]')
const menuToggle = document.querySelector('[data-menu-toggle]')
const mobileNav = document.querySelector('[data-mobile-nav]')
const form = document.querySelector('[data-contact-form]')
const formStatus = document.querySelector('[data-form-status]')
const year = document.querySelector('[data-year]')

if (year) {
  year.textContent = String(new Date().getFullYear())
}

const setHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 8)
}

setHeaderState()
window.addEventListener('scroll', setHeaderState, { passive: true })

const closeMenu = () => {
  if (!menuToggle || !mobileNav) return
  menuToggle.setAttribute('aria-expanded', 'false')
  mobileNav.hidden = true
}

menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  mobileNav.hidden = expanded
})

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu)
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu()
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
