import type { MediaStorageKind, StoredMediaRecord } from '@/types/media'

const DATABASE_NAME = 'manju-media'
const DATABASE_VERSION = 1
const STORE_NAME = 'media'

const memoryRecords = new Map<string, StoredMediaRecord>()
const objectUrls = new Map<string, string>()
let databasePromise: Promise<IDBDatabase | null> | null = null

const canUseIndexedDb = (): boolean => typeof indexedDB !== 'undefined'

const openDatabase = async (): Promise<IDBDatabase | null> => {
  if (!canUseIndexedDb()) {
    return null
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    })
  }

  return databasePromise
}

const runTransaction = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, resolve: (value: T) => void) => void,
  fallback: () => T,
): Promise<T> => {
  const database = await openDatabase()
  if (!database) {
    return fallback()
  }

  return new Promise<T>((resolve) => {
    try {
      const transaction = database.transaction(STORE_NAME, mode)
      const store = transaction.objectStore(STORE_NAME)
      operation(store, resolve)
      transaction.onerror = () => resolve(fallback())
      transaction.onabort = () => resolve(fallback())
    } catch {
      resolve(fallback())
    }
  })
}

const createObjectUrl = (record: StoredMediaRecord): string => {
  const existing = objectUrls.get(record.id)
  if (existing) {
    return existing
  }

  const url = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(record.blob)
    : `mock-media://${record.id}`
  objectUrls.set(record.id, url)
  return url
}

export const mediaBlobRepository = {
  async save(record: StoredMediaRecord): Promise<MediaStorageKind> {
    memoryRecords.set(record.id, record)
    const database = await openDatabase()
    if (!database) {
      return 'memory'
    }

    const stored = await runTransaction<boolean>(
      'readwrite',
      (store, resolve) => {
        const request = store.put(record)
        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      },
      () => false,
    )

    return stored ? 'indexeddb' : 'memory'
  },

  async get(id: string): Promise<StoredMediaRecord | null> {
    const memoryRecord = memoryRecords.get(id)
    if (memoryRecord) {
      return memoryRecord
    }

    const record = await runTransaction<StoredMediaRecord | null>(
      'readonly',
      (store, resolve) => {
        const request = store.get(id)
        request.onsuccess = () => resolve((request.result as StoredMediaRecord | undefined) ?? null)
        request.onerror = () => resolve(null)
      },
      () => null,
    )

    if (record) {
      memoryRecords.set(id, record)
    }
    return record
  },

  async resolveUrl(id: string): Promise<string> {
    const record = await this.get(id)
    return record ? createObjectUrl(record) : ''
  },

  async remove(id: string): Promise<void> {
    memoryRecords.delete(id)
    const objectUrl = objectUrls.get(id)
    if (objectUrl && objectUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl)
    }
    objectUrls.delete(id)

    await runTransaction<void>(
      'readwrite',
      (store, resolve) => {
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
      },
      () => undefined,
    )
  },

  revokeObjectUrls(): void {
    for (const url of objectUrls.values()) {
      if (url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url)
      }
    }
    objectUrls.clear()
  },
}
