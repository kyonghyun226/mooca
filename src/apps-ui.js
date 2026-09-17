import { iconMarkup } from './data/app-icons.js'

export function fillIcon(target, app) {
  target.replaceChildren()
  if (app.iconUrl) {
    const img = document.createElement('img')
    img.src = app.iconUrl
    img.alt = ''
    img.width = 32
    img.height = 32
    target.append(img)
    return
  }
  target.innerHTML = iconMarkup(app.id)
}

export function createPublicAppCard(app) {
  const card = document.createElement('article')
  card.className = 'app-card'
  card.dataset.appId = app.id

  const icon = document.createElement('div')
  icon.className = 'card-icon'
  icon.setAttribute('aria-hidden', 'true')
  fillIcon(icon, app)

  const title = document.createElement('h3')
  title.className = 'card-title'
  title.textContent = app.name

  const body = document.createElement('p')
  body.className = 'card-body'
  body.textContent = app.description

  const tags = document.createElement('ul')
  tags.className = 'app-tags'
  tags.setAttribute('aria-label', '키워드')
  for (const tag of app.tags ?? []) {
    const item = document.createElement('li')
    item.textContent = tag
    tags.append(item)
  }

  card.append(icon, title, body, tags)

  const ios = app.appStoreUrl?.trim()
  const play = app.googlePlayUrl?.trim()
  if (ios || play) {
    const downloads = document.createElement('div')
    downloads.className = 'app-downloads'
    const label = document.createElement('p')
    label.className = 'app-downloads-label'
    label.textContent = '앱 다운로드'
    downloads.append(label)
    if (ios) {
      downloads.append(storeLink('App Store', ios, `${app.name} App Store`))
    }
    if (play) {
      downloads.append(storeLink('Google Play', play, `${app.name} Google Play`))
    }
    card.append(downloads)
  }

  return card
}

const storeLink = (label, href, aria) => {
  const link = document.createElement('a')
  link.className = 'store-btn'
  link.href = href
  link.textContent = label
  link.setAttribute('aria-label', aria)
  link.rel = 'noopener noreferrer'
  link.target = '_blank'
  return link
}
