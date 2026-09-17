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

const setMenuOpen = (open) => {
  if (!menuToggle || !mobileNav) return
  menuToggle.setAttribute('aria-expanded', String(open))
  mobileNav.hidden = !open
  document.body.classList.toggle('is-menu-open', open)
}

menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  setMenuOpen(!expanded)
})

mobileNav?.querySelectorAll('a').forEach((link) => {
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
