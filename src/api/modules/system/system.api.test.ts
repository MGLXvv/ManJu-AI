import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { systemApi } from './system.api'

describe('modules/system systemApi', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('creates styles enabled by default and updates style fields', async () => {
    const style = await systemApi.createStyle({
      name: '国风漫画',
      category: '国风',
      prompt: '水墨线条与暖金配色',
    })

    expect(style.enabled).toBe(true)

    const updated = await systemApi.updateStyle(style.id, {
      enabled: false,
      prompt: '更强的线稿对比',
      previewUrl: 'https://example.com/style.png',
    })

    expect(updated).toMatchObject({
      id: style.id,
      enabled: false,
      prompt: '更强的线稿对比',
      previewUrl: 'https://example.com/style.png',
    })
  })

  it('creates permissions with updatedAt and merges nested permissions on update', async () => {
    const permission = await systemApi.createPermission({
      role: '运营',
      members: 2,
      permissions: {
        resourceLibrary: true,
        storyboard: false,
        dubbing: false,
        systemMessage: true,
      },
    })

    expect(permission.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)

    const updated = await systemApi.updatePermission(permission.id, {
      permissions: {
        storyboard: true,
      },
    })

    expect(updated?.permissions).toEqual({
      resourceLibrary: true,
      storyboard: true,
      dubbing: false,
      systemMessage: true,
    })
  })

  it('marks single messages, marks all messages, and clears messages', async () => {
    const initial = await systemApi.getState()
    const target = initial.messages[0]

    const singleUpdated = await systemApi.markMessageRead(target.id)
    expect(singleUpdated?.status).toBe('read')

    const afterSingle = await systemApi.getState()
    expect(afterSingle.messages.find((item) => item.id === target.id)?.status).toBe('read')

    await systemApi.markAllRead()
    const afterAll = await systemApi.getState()
    expect(afterAll.messages.every((item) => item.status === 'read')).toBe(true)

    await systemApi.clearMessages()
    const cleared = await systemApi.getState()
    expect(cleared.messages).toHaveLength(0)
  })
})
