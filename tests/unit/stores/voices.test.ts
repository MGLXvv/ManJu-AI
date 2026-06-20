import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { useVoicesStore } from '@/stores/voices'

describe('voices store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetLocalState()
  })

  it('hydrates and filters voices case-insensitively', async () => {
    const store = useVoicesStore()

    await store.hydrate()
    await store.createVoice({
      name: 'DemoVoice',
      audioUrl: 'mock://voice.wav',
      duration: 8,
    })
    store.setKeyword('demovoice')

    expect(store.hydrated).toBe(true)
    expect(store.filteredVoices.some((voice) => voice.name === 'DemoVoice')).toBe(true)
  })
})
