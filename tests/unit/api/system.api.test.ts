import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { systemApi } from '@/api/system.api'
import { systemApi as moduleSystemApi } from '@/api/modules/system'

describe('system api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('re-exports the module-level system api for compatibility', () => {
    expect(systemApi).toBe(moduleSystemApi)
  })

  it('hydrates default system state', async () => {
    const state = await systemApi.getState()

    expect(state.styles.length).toBeGreaterThan(0)
    expect(state.permissions.length).toBeGreaterThan(0)
    expect(state.messages.length).toBeGreaterThan(0)
  })

  it('supports style, permission, and message mutations', async () => {
    const style = await systemApi.createStyle({
      name: '新风格',
      category: '测试',
      prompt: '测试风格提示词',
    })
    const permission = await systemApi.createPermission({
      role: '测试角色',
      members: 1,
      permissions: {
        resourceLibrary: true,
        storyboard: false,
        dubbing: false,
        systemMessage: true,
      },
    })
    const stateAfterCreate = await systemApi.getState()

    expect(stateAfterCreate.styles.some((item) => item.id === style.id)).toBe(true)
    expect(stateAfterCreate.permissions.some((item) => item.id === permission.id)).toBe(true)

    await systemApi.markAllRead()
    const readState = await systemApi.getState()
    expect(readState.messages.every((item) => item.status === 'read')).toBe(true)

    await systemApi.deleteStyle(style.id)
    await systemApi.deletePermission(permission.id)
    await systemApi.clearMessages()
    const cleared = await systemApi.getState()

    expect(cleared.styles.some((item) => item.id === style.id)).toBe(false)
    expect(cleared.permissions.some((item) => item.id === permission.id)).toBe(false)
    expect(cleared.messages).toHaveLength(0)
  })

  it('defaults newly created styles to enabled', async () => {
    const style = await systemApi.createStyle({
      name: '新风格',
      category: '测试',
      prompt: '测试风格提示词',
    })

    expect(style.enabled).toBe(true)
  })
})
