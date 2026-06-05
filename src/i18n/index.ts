import { createI18n } from 'vue-i18n'
import { messages, type AppLocale } from './messages'

const LOCALE_STORAGE_KEY = 'amd.locale'
const DEFAULT_LOCALE: AppLocale = 'zh-CN'

const readInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale | null
  if (stored && stored in messages) {
    return stored
  }

  const browserLocale = window.navigator.language as AppLocale
  if (browserLocale in messages) {
    return browserLocale
  }

  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: readInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export const setAppLocale = (locale: AppLocale): void => {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }
}

setAppLocale(i18n.global.locale.value as AppLocale)

export { LOCALE_STORAGE_KEY }
