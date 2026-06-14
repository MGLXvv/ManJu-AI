import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadStoryboardPromptCollapsed, saveStoryboardPromptCollapsed } from './storyboardPanelState'

const createStorage = () => {
  const state = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => state.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      state.set(key, value)
    }),
    clear: vi.fn(() => {
      state.clear()
    }),
  }
}

describe('storyboardPanelState', () => {
  let storage: ReturnType<typeof createStorage>

  beforeEach(() => {
    storage = createStorage()
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: storage },
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    storage.clear()
    vi.restoreAllMocks()
  })

  it('returns fallback when there is no saved state', () => {
    expect(loadStoryboardPromptCollapsed()).toBe(false)
    expect(loadStoryboardPromptCollapsed(true)).toBe(true)
  })

  it('loads saved collapsed state from localStorage', () => {
    storage.setItem('manju:storyboard:prompt-panel-collapsed', '1')

    expect(loadStoryboardPromptCollapsed()).toBe(true)
  })

  it('saves collapsed state into localStorage', () => {
    saveStoryboardPromptCollapsed(true)
    expect(storage.getItem('manju:storyboard:prompt-panel-collapsed')).toBe('1')

    saveStoryboardPromptCollapsed(false)
    expect(storage.getItem('manju:storyboard:prompt-panel-collapsed')).toBe('0')
  })

  it('falls back safely when storage access throws', () => {
    storage.getItem.mockImplementation(() => {
      throw new Error('storage failed')
    })

    expect(loadStoryboardPromptCollapsed(true)).toBe(true)
  })
})
