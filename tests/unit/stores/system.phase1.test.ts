import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { systemApiMock } = vi.hoisted(() => ({
  systemApiMock: {
    getState: vi.fn(),
    createStyle: vi.fn(),
    updateStyle: vi.fn(),
    deleteStyle: vi.fn(),
    createPermission: vi.fn(),
    updatePermission: vi.fn(),
    deletePermission: vi.fn(),
    markMessageRead: vi.fn(),
    markAllRead: vi.fn(),
    clearMessages: vi.fn(),
  },
}))

vi.mock('@/api/system.api', () => ({
  systemApi: systemApiMock,
}))

describe('system store phase1 compat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(systemApiMock).forEach((fn) => fn.mockReset())
    vi.resetModules()
  })

  it('hydrates safely when system state omits managed collections', async () => {
    systemApiMock.getState.mockResolvedValue({})
    const { useSystemStore } = await import('@/stores/system')

    const store = useSystemStore()
    await store.hydrate()

    expect(store.styles).toEqual([])
    expect(store.permissions).toEqual([])
    expect(store.messages).toEqual([])
    expect(store.hydrated).toBe(true)
  })

  it('keeps local message state stable when markMessageRead returns null', async () => {
    systemApiMock.getState.mockResolvedValue({
      styles: [],
      permissions: [],
      messages: [
        {
          id: 'msg-1',
          title: 'Notice',
          summary: 'Summary',
          content: 'Body',
          status: 'unread',
          level: 'normal',
          relativeTime: 'just now',
          platform: 'web',
          loginMethod: 'password',
          location: 'CN',
          loginTime: '2026-07-01 10:00:00',
        },
      ],
    })
    systemApiMock.markMessageRead.mockResolvedValue(null)
    const { useSystemStore } = await import('@/stores/system')

    const store = useSystemStore()
    await store.hydrate()
    await store.markMessageRead('msg-1')

    expect(store.messages[0]?.status).toBe('read')
  })

  it('keeps local messages readable when markAllRead returns an empty list', async () => {
    systemApiMock.getState.mockResolvedValue({
      styles: [],
      permissions: [],
      messages: [
        {
          id: 'msg-1',
          title: 'Notice',
          summary: 'Summary',
          content: 'Body',
          status: 'unread',
          level: 'normal',
          relativeTime: 'just now',
          platform: 'web',
          loginMethod: 'password',
          location: 'CN',
          loginTime: '2026-07-01 10:00:00',
        },
      ],
    })
    systemApiMock.markAllRead.mockResolvedValue([])
    const { useSystemStore } = await import('@/stores/system')

    const store = useSystemStore()
    await store.hydrate()
    await store.markAllRead()

    expect(store.messages.every((item) => item.status === 'read')).toBe(true)
  })
})