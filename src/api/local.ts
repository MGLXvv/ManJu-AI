import { createApiError } from '@/api/errors'
import { API_ERROR_CODES } from '@/types/api-enums'

export const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const memoryStorage = new Map<string, string>()

const isQuotaExceededError = (error: unknown): boolean => {
  if (!(error instanceof DOMException)) {
    return false
  }

  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014
}

export const readLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    const raw = memoryStorage.get(key)
    if (!raw) {
      return fallback
    }

    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const writeLocal = <T>(key: string, value: T): void => {
  const serialized = JSON.stringify(value)

  if (typeof window === 'undefined') {
    memoryStorage.set(key, serialized)
    return
  }

  try {
    window.localStorage.setItem(key, serialized)
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw createApiError({
        message: 'Local storage quota exceeded',
        code: API_ERROR_CODES.editorLocalStorageQuotaExceeded,
        status: 507,
      })
    }

    throw error
  }
}

export const removeLocal = (key: string): void => {
  if (typeof window === 'undefined') {
    memoryStorage.delete(key)
    return
  }

  window.localStorage.removeItem(key)
}

export const resetLocalState = (): void => {
  if (typeof window === 'undefined') {
    memoryStorage.clear()
    return
  }

  window.localStorage.clear()
}
