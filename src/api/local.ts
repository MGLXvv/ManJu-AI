import { createApiError, isApiError } from '@/api/errors'
import { AppError } from '@/services/runtime/appError'
import { reportRuntimeError } from '@/services/runtime/runtimeDiagnostics'
import { API_ERROR_CODES } from '@/types/api-enums'

export const delay = (ms = 120): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
export const LOCAL_STORAGE_SCHEMA_VERSION = 1
export const CORRUPTED_LOCAL_STORAGE_PREFIX = 'manju:corrupted:'

export interface LocalStorageLike {
  readonly length: number
  clear(): void
  getItem(key: string): string | null
  key(index: number): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

interface LocalStorageEnvelope<T> {
  schemaVersion: number
  value: T
}

const memoryStorage = new Map<string, string>()

const memoryStorageAdapter: LocalStorageLike = {
  get length() {
    return memoryStorage.size
  },
  clear: () => memoryStorage.clear(),
  getItem: (key) => memoryStorage.get(key) ?? null,
  key: (index) => [...memoryStorage.keys()][index] ?? null,
  removeItem: (key) => memoryStorage.delete(key),
  setItem: (key, value) => memoryStorage.set(key, value),
}

export const isQuotaExceededError = (error: unknown): boolean => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014
  }

  if (error && typeof error === 'object') {
    const value = error as { name?: string; code?: number }
    return value.name === 'QuotaExceededError' || value.name === 'NS_ERROR_DOM_QUOTA_REACHED' || value.code === 22 || value.code === 1014
  }

  return false
}

const resolveBrowserStorage = (): LocalStorageLike | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    reportRuntimeError(error, {
      code: 'LOCAL_STORAGE_UNAVAILABLE',
      category: 'storage',
      message: '浏览器本地存储不可用，已切换为临时存储',
    })
    return null
  }
}

const isEnvelope = (value: unknown): value is LocalStorageEnvelope<unknown> =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as Partial<LocalStorageEnvelope<unknown>>).schemaVersion === 'number' &&
  Object.prototype.hasOwnProperty.call(value, 'value')

const corruptedStorageKey = (key: string): string => `${CORRUPTED_LOCAL_STORAGE_PREFIX}${encodeURIComponent(key)}`

const quarantineCorruptedValue = (storage: LocalStorageLike, key: string, raw: string): void => {
  try {
    storage.setItem(corruptedStorageKey(key), raw)
  } catch {
    // The invalid entry is still removed below so it cannot block application startup.
  }

  try {
    storage.removeItem(key)
  } catch {
    // Storage may be partially unavailable; the read operation still falls back safely.
  }

  reportRuntimeError(new AppError({
    code: 'LOCAL_STORAGE_CORRUPTED',
    category: 'storage',
    message: '检测到损坏的本地数据，已隔离并使用默认值',
    recoverable: true,
    context: { key },
  }))
}

export const readStorageValue = <T>(storage: LocalStorageLike, key: string, fallback: T): T => {
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (error) {
    reportRuntimeError(error, {
      code: 'LOCAL_STORAGE_READ_FAILED',
      category: 'storage',
      message: '读取本地数据失败，已使用默认值',
      context: { key },
    })
    return fallback
  }

  if (raw === null) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isEnvelope(parsed)) {
      return parsed as T
    }

    if (parsed.schemaVersion !== LOCAL_STORAGE_SCHEMA_VERSION) {
      reportRuntimeError(new AppError({
        code: 'LOCAL_STORAGE_SCHEMA_UNSUPPORTED',
        category: 'storage',
        message: '本地数据版本暂不兼容，已使用默认值',
        recoverable: true,
        context: { key, schemaVersion: parsed.schemaVersion },
      }))
      return fallback
    }

    return parsed.value as T
  } catch {
    quarantineCorruptedValue(storage, key, raw)
    return fallback
  }
}

export const writeStorageValue = <T>(storage: LocalStorageLike, key: string, value: T): void => {
  let serialized: string
  try {
    serialized = JSON.stringify({
      schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      value,
    } satisfies LocalStorageEnvelope<T>)
  } catch (error) {
    throw new AppError({
      code: 'LOCAL_STORAGE_SERIALIZE_FAILED',
      category: 'storage',
      message: '本地数据序列化失败',
      recoverable: true,
      cause: error,
      context: { key },
    })
  }

  try {
    storage.setItem(key, serialized)
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw createApiError({
        message: 'Local storage quota exceeded',
        code: API_ERROR_CODES.editorLocalStorageQuotaExceeded,
        status: 507,
      })
    }

    throw new AppError({
      code: 'LOCAL_STORAGE_WRITE_FAILED',
      category: 'storage',
      message: '浏览器本地存储写入失败',
      recoverable: true,
      cause: error,
      context: { key },
    })
  }
}

export const readLocal = <T>(key: string, fallback: T): T => {
  const browserStorage = resolveBrowserStorage()
  return readStorageValue(browserStorage ?? memoryStorageAdapter, key, fallback)
}

export const writeLocal = <T>(key: string, value: T): void => {
  const browserStorage = resolveBrowserStorage()
  if (!browserStorage) {
    writeStorageValue(memoryStorageAdapter, key, value)
    return
  }

  try {
    writeStorageValue(browserStorage, key, value)
  } catch (error) {
    if (isApiError(error) && error.code === API_ERROR_CODES.editorLocalStorageQuotaExceeded) {
      throw error
    }

    reportRuntimeError(error, {
      code: 'LOCAL_STORAGE_WRITE_FAILED',
      category: 'storage',
      message: '本地数据写入失败，已切换为临时存储',
      context: { key },
    })
    writeStorageValue(memoryStorageAdapter, key, value)
  }
}

export const removeLocal = (key: string): void => {
  const browserStorage = resolveBrowserStorage()
  try {
    browserStorage?.removeItem(key)
  } catch (error) {
    reportRuntimeError(error, {
      code: 'LOCAL_STORAGE_REMOVE_FAILED',
      category: 'storage',
      message: '移除本地数据失败',
      context: { key },
    })
  }
  memoryStorageAdapter.removeItem(key)
}

const collectCorruptedKeys = (storage: LocalStorageLike): string[] => {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(CORRUPTED_LOCAL_STORAGE_PREFIX)) {
      keys.push(key)
    }
  }
  return keys
}

export const listCorruptedLocalEntries = (): string[] => {
  const browserStorage = resolveBrowserStorage()
  const keys = new Set<string>([
    ...collectCorruptedKeys(memoryStorageAdapter),
    ...(browserStorage ? collectCorruptedKeys(browserStorage) : []),
  ])

  return [...keys].map((key) => {
    const encoded = key.slice(CORRUPTED_LOCAL_STORAGE_PREFIX.length)
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  })
}

export const clearCorruptedLocalEntries = (): void => {
  const browserStorage = resolveBrowserStorage()
  for (const storage of [memoryStorageAdapter, browserStorage].filter((value): value is LocalStorageLike => Boolean(value))) {
    for (const key of collectCorruptedKeys(storage)) {
      try {
        storage.removeItem(key)
      } catch {
        // Cleanup is best-effort and remains recoverable through a full browser reset.
      }
    }
  }
}

export const resetLocalState = (): void => {
  memoryStorageAdapter.clear()
  const browserStorage = resolveBrowserStorage()
  if (!browserStorage) {
    return
  }

  try {
    browserStorage.clear()
  } catch (error) {
    reportRuntimeError(error, {
      code: 'LOCAL_STORAGE_RESET_FAILED',
      category: 'storage',
      message: '清理本地数据失败',
    })
  }
}
