import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('storyboardImageTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardImageTaskService } = await import('@/services/editor/storyboardImageTask.service')
    const result = await storyboardImageTaskService.createStoryboardImageTask('1')

    expect(result).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('creates storyboard image task in http mode without body when prompt is missing', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 6,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/6.png',
      },
    })

    const { storyboardImageTaskService } = await import('@/services/editor/storyboardImageTask.service')
    const result = await storyboardImageTaskService.createStoryboardImageTask('1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/storyboards/1/generate-image')
    expect(result).toMatchObject({
      id: '6',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/6.png',
    })
  })

  it('sends prompt body when prompt exists', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        taskId: 8,
        status: 'RUNNING',
        progress: 30,
      },
    })

    const { storyboardImageTaskService } = await import('@/services/editor/storyboardImageTask.service')
    await storyboardImageTaskService.createStoryboardImageTask('7', 'anime rooftop')

    expect(http.post).toHaveBeenCalledWith('/aidrama/storyboards/7/generate-image', {
      prompt: 'anime rooftop',
    })
  })
})
