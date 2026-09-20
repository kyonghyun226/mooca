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

const pad = (n) => String(n).padStart(2, '0')

export function createPublicAppRow(app, index) {
  const row = document.createElement('li')
  row.className = 'pub-app-row'
  row.dataset.appId = app.id

  const no = document.createElement('span')
  no.className = 'pub-app-no'
  no.setAttribute('aria-hidden', 'true')
  no.textContent = pad(index + 1)

  const info = document.createElement('div')
  info.className = 'pub-app-info'

  const name = document.createElement('h3')
  name.className = 'pub-app-name'
  name.textContent = app.name

  const desc = document.createElement('p')
  desc.className = 'app-desc'
  desc.textContent = app.description

  const tags = document.createElement('p')
  tags.className = 'app-tags'
  tags.textContent = (app.tags ?? []).join(' · ')

  info.append(name, desc)
  if ((app.tags ?? []).length) info.append(tags)

  row.append(no, info)

  const ios = app.appStoreUrl?.trim()
  const play = app.googlePlayUrl?.trim()
  if (ios || play) {
    const links = document.createElement('div')
    links.className = 'pub-app-links'
    if (ios) links.append(storeLink('App Store', ios, `${app.name} App Store`))
    if (play) links.append(storeLink('Google Play', play, `${app.name} Google Play`))
    row.append(links)
  }

  return row
}

/** @deprecated kept for admin preview compatibility */
export function createPublicAppCard(app) {
  return createPublicAppRow(app, 0)
}

const storeLink = (label, href, aria) => {
  const link = document.createElement('a')
  link.href = href
  link.textContent = label
  link.setAttribute('aria-label', aria)
  link.rel = 'noopener noreferrer'
  link.target = '_blank'
  return link
}
