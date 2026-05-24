const hasWindow = typeof window !== 'undefined'

export const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const readLocal = <T>(key: string, fallback: T): T => {
  if (!hasWindow) {
    return fallback
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
  if (!hasWindow) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export const removeLocal = (key: string): void => {
  if (!hasWindow) {
    return
  }

  window.localStorage.removeItem(key)
}
