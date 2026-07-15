import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearCorruptedLocalEntries,
  CORRUPTED_LOCAL_STORAGE_PREFIX,
  listCorruptedLocalEntries,
  LOCAL_STORAGE_SCHEMA_VERSION,
  readLocal,
  readLocalString,
  readStorageValue,
  removeLocalString,
  resetLocalState,
  type LocalStorageLike,
  writeLocal,
  writeLocalString,
  writeStorageValue,
} from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'
import { getCurrentRuntimeError, resetRuntimeDiagnostics } from '@/services/runtime/runtimeDiagnostics'

class MemoryStorage implements LocalStorageLike {
  protected readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('local storage recovery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    resetLocalState()
    resetRuntimeDiagnostics()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('writes versioned values and reads both versioned and legacy values', () => {
    const storage = new MemoryStorage()
    writeStorageValue(storage, 'versioned', { enabled: true })
    storage.setItem('legacy', JSON.stringify(['old-value']))

    expect(JSON.parse(storage.getItem('versioned') ?? '{}')).toEqual({
      schemaVersion: LOCAL_STORAGE_SCHEMA_VERSION,
      value: { enabled: true },
    })
    expect(readStorageValue(storage, 'versioned', null)).toEqual({ enabled: true })
    expect(readStorageValue(storage, 'legacy', [])).toEqual(['old-value'])
  })

  it('isolates malformed JSON and reports a recoverable diagnostic', () => {
    const storage = new MemoryStorage()
    storage.setItem('broken-key', '{invalid-json')

    expect(readStorageValue(storage, 'broken-key', { fallback: true })).toEqual({ fallback: true })
    expect(storage.getItem('broken-key')).toBeNull()
    expect(storage.getItem(`${CORRUPTED_LOCAL_STORAGE_PREFIX}${encodeURIComponent('broken-key')}`)).toBe(
      '{invalid-json',
    )
    expect(getCurrentRuntimeError()).toMatchObject({
      code: 'LOCAL_STORAGE_CORRUPTED',
      category: 'storage',
    })
  })

  it('preserves the existing quota exceeded API error contract', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw { name: 'QuotaExceededError', code: 22 }
    }

    expect(() => writeStorageValue(storage, 'large-draft', { value: 'x' })).toThrow('Local storage quota exceeded')

    try {
      writeStorageValue(storage, 'large-draft', { value: 'x' })
    } catch (error) {
      expect(error).toMatchObject({
        code: API_ERROR_CODES.editorLocalStorageQuotaExceeded,
        status: 507,
      })
    }
  })

  it('falls back to memory when browser localStorage is unavailable', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('blocked by browser policy')
      },
    })

    writeLocal('temporary-key', { ok: true })
    expect(readLocal('temporary-key', null)).toEqual({ ok: true })
    expect(getCurrentRuntimeError()).toMatchObject({ code: 'LOCAL_STORAGE_UNAVAILABLE' })
  })

  it('preserves raw string preferences and removes them safely', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', { localStorage: storage })

    writeLocalString('locale', 'zh-CN')

    expect(storage.getItem('locale')).toBe('zh-CN')
    expect(readLocalString('locale', 'en-US')).toBe('zh-CN')

    removeLocalString('locale')
    expect(storage.getItem('locale')).toBeNull()
    expect(readLocalString('locale', 'en-US')).toBe('en-US')
  })

  it('falls back to memory when raw string preference writes fail', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new Error('storage write blocked')
    }
    vi.stubGlobal('window', { localStorage: storage })

    expect(() => writeLocalString('remembered-account', 'creator@example.com')).not.toThrow()
    expect(readLocalString('remembered-account')).toBe('creator@example.com')
    expect(getCurrentRuntimeError()).toMatchObject({ code: 'LOCAL_STORAGE_WRITE_FAILED' })
  })

  it('lists and clears quarantined browser entries without clearing valid data', () => {
    const storage = new MemoryStorage()
    vi.stubGlobal('window', { localStorage: storage })
    storage.setItem('valid-key', JSON.stringify({ value: 'legacy' }))
    storage.setItem('broken-browser-key', '{bad-json')

    expect(readLocal('broken-browser-key', null)).toBeNull()
    expect(listCorruptedLocalEntries()).toContain('broken-browser-key')

    clearCorruptedLocalEntries()
    expect(listCorruptedLocalEntries()).toEqual([])
    expect(storage.getItem('valid-key')).not.toBeNull()
  })
})
