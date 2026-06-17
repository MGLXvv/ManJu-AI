export const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const memoryStorage = new Map<string, string>()

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
  if (typeof window === 'undefined') {
    memoryStorage.set(key, JSON.stringify(value))
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
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
