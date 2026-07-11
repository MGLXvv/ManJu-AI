import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('resolveHttpReadonlyState', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doUnmock('@/config/runtimeConfig')
  })

  it('returns writable state in mock mode', async () => {
    vi.doMock('@/config/runtimeConfig', () => ({
      runtimeConfig: {
        apiMode: 'mock',
        enabledCapabilities: [],
        disabledCapabilities: [],
      },
    }))

    const { resolveHttpReadonlyState } = await import('@/features/backend/httpReadonlyState')

    expect(resolveHttpReadonlyState('resource')).toEqual({
      readonly: false,
      message: '',
    })
  })

  it('returns readonly state with per-domain message in http mode', async () => {
    vi.doMock('@/config/runtimeConfig', () => ({
      runtimeConfig: {
        apiMode: 'http',
        enabledCapabilities: [],
        disabledCapabilities: [],
      },
    }))

    const { resolveHttpReadonlyState } = await import('@/features/backend/httpReadonlyState')

    expect(resolveHttpReadonlyState('voice')).toEqual({
      readonly: true,
      message: '当前 HTTP 联调阶段暂不支持音色新增、编辑或删除',
    })
    expect(resolveHttpReadonlyState('system')).toEqual({
      readonly: true,
      message: '当前 HTTP 联调阶段暂不支持系统管理写操作',
    })
  })
})
