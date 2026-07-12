import { describe, expect, it, vi } from 'vitest'
import {
  attemptChunkLoadRecovery,
  CHUNK_RECOVERY_STORAGE_KEY,
  clearChunkLoadRecoveryMarker,
  isChunkLoadError,
  type ChunkRecoveryLocation,
  type SessionStorageLike,
} from '@/services/runtime/chunkLoadRecovery'

const createStorage = (): SessionStorageLike & { values: Map<string, string> } => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

const createLocation = (): ChunkRecoveryLocation & { reload: ReturnType<typeof vi.fn> } => ({
  pathname: '/projects/1/editor',
  search: '?tab=script',
  hash: '',
  reload: vi.fn(),
})

describe('chunk load recovery', () => {
  it('recognizes common dynamic import failures', () => {
    expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError('Loading chunk editor failed')).toBe(true)
    expect(isChunkLoadError(new Error('ordinary runtime error'))).toBe(false)
  })

  it('reloads once and blocks a refresh loop for the same route', () => {
    const storage = createStorage()
    const location = createLocation()

    const first = attemptChunkLoadRecovery(new Error('Importing a module script failed'), {
      storage,
      location,
      now: () => 1_000,
    })
    const second = attemptChunkLoadRecovery(new Error('Importing a module script failed'), {
      storage,
      location,
      now: () => 2_000,
    })

    expect(first).toBe(true)
    expect(second).toBe(false)
    expect(location.reload).toHaveBeenCalledTimes(1)
    expect(storage.values.has(CHUNK_RECOVERY_STORAGE_KEY)).toBe(true)
  })

  it('allows a later recovery attempt and supports clearing the marker', () => {
    const storage = createStorage()
    const location = createLocation()

    expect(
      attemptChunkLoadRecovery('Loading chunk editor failed', {
        storage,
        location,
        now: () => 1_000,
      }),
    ).toBe(true)
    expect(
      attemptChunkLoadRecovery('Loading chunk editor failed', {
        storage,
        location,
        now: () => 70_000,
      }),
    ).toBe(true)

    clearChunkLoadRecoveryMarker(storage)
    expect(storage.values.has(CHUNK_RECOVERY_STORAGE_KEY)).toBe(false)
  })

  it('does not reload when session storage is unavailable', () => {
    const location = createLocation()
    expect(
      attemptChunkLoadRecovery('Loading chunk editor failed', {
        storage: null,
        location,
      }),
    ).toBe(false)
    expect(location.reload).not.toHaveBeenCalled()
  })
})
