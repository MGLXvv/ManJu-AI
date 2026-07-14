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

  it('keeps Phase1 real catalog writes enabled and controlled-reject system writes readonly', async () => {
    vi.doMock('@/config/runtimeConfig', () => ({
      runtimeConfig: {
        apiMode: 'http',
        enabledCapabilities: [],
        disabledCapabilities: [],
      },
    }))

    const { resolveHttpReadonlyState } = await import('@/features/backend/httpReadonlyState')

    expect(resolveHttpReadonlyState('voice')).toEqual({
      readonly: false,
      message: '',
    })
    expect(resolveHttpReadonlyState('resource')).toEqual({
      readonly: false,
      message: '',
    })
    expect(resolveHttpReadonlyState('system')).toEqual({
      readonly: true,
      message: 'Phase1 系统样式和权限写接口为受控拒绝',
    })
  })
})
