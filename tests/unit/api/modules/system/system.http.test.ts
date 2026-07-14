import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    patch,
    delete: del,
  },
}))

describe('systemHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('normalizes lightweight system payloads to empty collections', async () => {
    get.mockResolvedValue({
      data: {
        featureFlags: { styleWriteEnabled: false },
        providerModes: { image: 'mock' },
      },
    })

    const { systemHttpApi } = await import('@/api/modules/system/system.http')
    const state = await systemHttpApi.getState()

    expect(get).toHaveBeenCalledWith('/system')
    expect(state).toEqual({
      styles: [],
      permissions: [],
      messages: [],
    })
  })

  it('preserves full state payloads when collections are present', async () => {
    get.mockResolvedValue({
      data: {
        state: {
          styles: [{ id: 'style-1', name: 'Anime', category: '2D', prompt: 'prompt' }],
          permissions: [
            {
              id: 'perm-1',
              role: 'Admin',
              members: 1,
              permissions: { resourceLibrary: true, storyboard: true, dubbing: true, systemMessage: true },
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
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
        },
      },
    })

    const { systemHttpApi } = await import('@/api/modules/system/system.http')
    const state = await systemHttpApi.getState()

    expect(state.styles).toHaveLength(1)
    expect(state.permissions).toHaveLength(1)
    expect(state.messages).toHaveLength(1)
  })

  it('accepts null data from Phase1 no-op message endpoints', async () => {
    post.mockResolvedValue({ data: null })

    const { systemHttpApi } = await import('@/api/modules/system/system.http')

    await expect(systemHttpApi.markMessageRead('msg-1')).resolves.toBeNull()
    await expect(systemHttpApi.markAllRead()).resolves.toEqual([])

    expect(post).toHaveBeenNthCalledWith(1, '/system/messages/msg-1/read')
    expect(post).toHaveBeenNthCalledWith(2, '/system/messages/read-all')
  })
})
