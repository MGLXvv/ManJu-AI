export type ApiMode = 'mock' | 'http'

const parseBoolean = (value: string | boolean | undefined): boolean =>
  value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true')

const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeBaseUrl = (value: string | undefined): string => {
  const normalized = value?.trim() || '/admin-api'
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized
}

const rawApiMode = import.meta.env.VITE_API_MODE?.trim()
const strict = import.meta.env.PROD || parseBoolean(import.meta.env.VITE_STRICT_RUNTIME_CONFIG)

if (strict && rawApiMode !== 'mock' && rawApiMode !== 'http') {
  throw new Error('RUNTIME_CONFIG_INVALID_API_MODE')
}

export const runtimeConfig = Object.freeze({
  apiMode: (rawApiMode === 'http' ? 'http' : 'mock') as ApiMode,
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  strict,
  enabledCapabilities: Object.freeze(parseList(import.meta.env.VITE_ENABLED_CAPABILITIES)),
  disabledCapabilities: Object.freeze(parseList(import.meta.env.VITE_DISABLED_CAPABILITIES)),
})
