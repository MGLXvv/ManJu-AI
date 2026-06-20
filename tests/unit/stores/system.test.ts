import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { useSystemStore } from '@/stores/system'

describe('system store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetLocalState()
  })

  it('hydrates system state and applies message lifecycle actions', async () => {
    const store = useSystemStore()

    await store.hydrate()
    expect(store.hydrated).toBe(true)
    expect(store.paginatedMessages.length).toBeGreaterThan(0)

    const targetId = store.messages[0]?.id
    expect(targetId).toBeTruthy()

    await store.markMessageRead(targetId!)
    expect(store.messages.find((item) => item.id === targetId)?.status).toBe('read')

    await store.markAllRead()
    expect(store.messages.every((item) => item.status === 'read')).toBe(true)
  })
})
