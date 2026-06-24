import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('storyboardWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does nothing in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    await storyboardWorkflowService.confirmStoryboard('project-1')

    expect(http.post).not.toHaveBeenCalled()
  })

  it('confirms storyboard through backend endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: undefined })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    await storyboardWorkflowService.confirmStoryboard('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/confirm')
  })

  it('generates storyboard through backend endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        storyboards: [{ id: 1, sort: 1, content: '镜头一' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.generateStoryboard('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/generate')
    expect(patch?.shots).toHaveLength(1)
    expect(patch?.shots[0].id).toBe('1')
  })

  it('falls back to workspace when generate returns no shots', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: { storyboards: [] } })
    vi.mocked(http.get).mockResolvedValue({
      data: {
        storyboards: [{ id: 2, sort: 2, content: '回退镜头' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.generateStoryboard('project-1')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/workspace')
    expect(patch?.shots[0].id).toBe('2')
  })
})
