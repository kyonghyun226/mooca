export const APP_IDS = ['seesaw', 'pooptime', 'randomdrop', 'banjjak', 'ieum']

export const DEFAULT_ICONS = {
  seesaw: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 18c3-6 5-10 10-10s7 4 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 20c2-3.5 3.2-5.5 6-5.5s4 2 6 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="22" r="2" stroke="currentColor" stroke-width="1.5"/></svg>`,
  pooptime: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="7" y="6" width="18" height="22" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 12h10M11 16h7M11 20h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  randomdrop: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M7 12a5 5 0 015-5h4a5 5 0 015 5v2a5 5 0 01-5 5h-2l-4 3v-3a5 5 0 01-5-5v-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="1" fill="currentColor"/><circle cx="16" cy="13.5" r="1" fill="currentColor"/><circle cx="20" cy="13.5" r="1" fill="currentColor"/></svg>`,
  banjjak: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="8.5" r="1.8" stroke="currentColor" stroke-width="1.5"/><circle cx="20.5" cy="13.5" r="1.8" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="15.5" r="1.8" stroke="currentColor" stroke-width="1.5"/><path d="M8 24c2-4 5-6 8-6s6 2 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  ieum: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="10" cy="14" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="22" cy="14" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M14 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 22c1.5-2.5 3.5-3.5 6-3.5M24 22c-1.5-2.5-3.5-3.5-6-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
}

export function iconMarkup(appId) {
  return DEFAULT_ICONS[appId] ?? DEFAULT_ICONS.seesaw
}
