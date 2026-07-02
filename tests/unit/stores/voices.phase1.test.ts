import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { voiceApiMock } = vi.hoisted(() => ({
  voiceApiMock: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/api/voice.api', () => ({
  voiceApi: voiceApiMock,
}))

describe('voices store http write compat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(voiceApiMock).forEach((fn) => fn.mockReset())
    vi.resetModules()
  })

  it('hydrates from an empty http voice list', async () => {
    voiceApiMock.list.mockResolvedValue([])

    const { useVoicesStore } = await import('@/stores/voices')
    const store = useVoicesStore()
    await store.hydrate()

    expect(store.hydrated).toBe(true)
    expect(store.voices).toEqual([])
  })

  it('creates, updates, and deletes voices through the api layer', async () => {
    voiceApiMock.list.mockResolvedValue([])
    voiceApiMock.create.mockResolvedValue({
      id: '12',
      name: 'Voice A',
      audioUrl: 'https://example.com/a.wav',
      duration: 12,
      createdAt: '2026-07-02T00:00:00.000Z',
    })
    voiceApiMock.update.mockResolvedValue({
      id: '12',
      name: 'Voice B',
      audioUrl: 'https://example.com/b.wav',
      duration: 15,
      createdAt: '2026-07-02T00:00:00.000Z',
    })
    voiceApiMock.remove.mockResolvedValue(undefined)

    const { useVoicesStore } = await import('@/stores/voices')
    const store = useVoicesStore()
    await store.hydrate()

    const created = await store.createVoice({
      name: 'Voice A',
      audioUrl: 'https://example.com/a.wav',
      duration: 12,
    })
    const updated = await store.updateVoice('12', {
      name: 'Voice B',
      audioUrl: 'https://example.com/b.wav',
      duration: 15,
    })
    await store.deleteVoice('12')

    expect(created.name).toBe('Voice A')
    expect(updated?.name).toBe('Voice B')
    expect(store.voices).toEqual([])
  })
})
