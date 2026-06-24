import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('scriptWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does nothing in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { scriptWorkflowService } = await import('@/services/editor/scriptWorkflow.service')

    await scriptWorkflowService.confirmScript('project-1')

    expect(http.post).not.toHaveBeenCalled()
  })

  it('confirms script through backend endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: undefined })

    const { scriptWorkflowService } = await import('@/services/editor/scriptWorkflow.service')

    await scriptWorkflowService.confirmScript('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/script/confirm')
  })
})
