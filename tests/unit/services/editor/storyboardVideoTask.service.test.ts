import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('storyboardVideoTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardVideoTaskService } = await import('@/services/editor/storyboardVideoTask.service')
    const result = await storyboardVideoTaskService.createStoryboardVideoTask('1')

    expect(result).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('creates storyboard video task in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 8,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/8.mp4',
      },
    })

    const { storyboardVideoTaskService } = await import('@/services/editor/storyboardVideoTask.service')
    const result = await storyboardVideoTaskService.createStoryboardVideoTask('1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/storyboards/1/generate-video', {})
    expect(result).toMatchObject({
      id: '8',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/8.mp4',
    })
  })
})
