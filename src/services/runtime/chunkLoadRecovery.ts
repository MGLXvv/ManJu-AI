const CHUNK_LOAD_PATTERN =
  /(Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|CSS_CHUNK_LOAD_FAILED)/i

export const CHUNK_RECOVERY_STORAGE_KEY = 'manju:runtime:chunk-recovery'
export const CHUNK_RECOVERY_WINDOW_MS = 60_000

export interface SessionStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ChunkRecoveryLocation {
  pathname: string
  search: string
  hash: string
  reload(): void
}

export interface ChunkLoadRecoveryOptions {
  storage?: SessionStorageLike | null
  location?: ChunkRecoveryLocation | null
  routeKey?: string
  now?: () => number
}

interface ChunkRecoveryMarker {
  routeKey: string
  timestamp: number
}

const resolveStorage = (storage: SessionStorageLike | null | undefined): SessionStorageLike | null => {
  if (storage !== undefined) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const resolveLocation = (location: ChunkRecoveryLocation | null | undefined): ChunkRecoveryLocation | null => {
  if (location !== undefined) {
    return location
  }
  return typeof window !== 'undefined' ? window.location : null
}

const parseMarker = (raw: string | null): ChunkRecoveryMarker | null => {
  if (!raw) {
    return null
  }

  try {
    const value = JSON.parse(raw) as Partial<ChunkRecoveryMarker>
    return typeof value.routeKey === 'string' && typeof value.timestamp === 'number'
      ? { routeKey: value.routeKey, timestamp: value.timestamp }
      : null
  } catch {
    return null
  }
}

export const isChunkLoadError = (value: unknown): boolean => {
  const message = value instanceof Error ? value.message : typeof value === 'string' ? value : ''
  return CHUNK_LOAD_PATTERN.test(message)
}

export const attemptChunkLoadRecovery = (value: unknown, options: ChunkLoadRecoveryOptions = {}): boolean => {
  if (!isChunkLoadError(value)) {
    return false
  }

  const storage = resolveStorage(options.storage)
  const location = resolveLocation(options.location)
  if (!storage || !location) {
    return false
  }

  const now = options.now?.() ?? Date.now()
  const routeKey = options.routeKey ?? `${location.pathname}${location.search}${location.hash}`

  try {
    const previous = parseMarker(storage.getItem(CHUNK_RECOVERY_STORAGE_KEY))
    if (previous?.routeKey === routeKey && now - previous.timestamp < CHUNK_RECOVERY_WINDOW_MS) {
      return false
    }

    storage.setItem(CHUNK_RECOVERY_STORAGE_KEY, JSON.stringify({ routeKey, timestamp: now }))
    location.reload()
    return true
  } catch {
    return false
  }
}

export const clearChunkLoadRecoveryMarker = (storage?: SessionStorageLike | null): void => {
  const resolvedStorage = resolveStorage(storage)
  if (!resolvedStorage) {
    return
  }

  try {
    resolvedStorage.removeItem(CHUNK_RECOVERY_STORAGE_KEY)
  } catch {
    // Recovery markers are optional and must never break navigation.
  }
}
