import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('providerSandboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does nothing in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { providerSandboxService } = await import('@/services/editor/providerSandbox.service')
    await providerSandboxService.markTaskSuccess({
      taskId: '1',
      resultUrl: '/sandbox-results/assets/1.png',
    })

    expect(http.post).not.toHaveBeenCalled()
  })

  it('posts sandbox success in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: undefined })

    const { providerSandboxService } = await import('@/services/editor/providerSandbox.service')
    await providerSandboxService.markTaskSuccess({
      taskId: '12',
      providerTaskId: 'provider-12',
      resultUrl: '/sandbox-results/assets/1.png',
    })

    expect(http.post).toHaveBeenCalledWith('/aidrama/provider-sandbox/tasks/12/success', {
      providerTaskId: 'provider-12',
      progress: 100,
      resultUrl: '/sandbox-results/assets/1.png',
    })
  })
})
