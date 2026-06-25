import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('storyboardVoiceTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardVoiceTaskService } = await import('@/services/editor/storyboardVoiceTask.service')
    const result = await storyboardVoiceTaskService.createStoryboardVoiceTask('1')

    expect(result).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('creates storyboard voice task in http mode without body', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 10,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/10.mp3',
        errorMsg: '',
      },
    })

    const { storyboardVoiceTaskService } = await import('@/services/editor/storyboardVoiceTask.service')
    const result = await storyboardVoiceTaskService.createStoryboardVoiceTask('1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/storyboards/1/generate-voice')
    expect(result).toMatchObject({
      id: '10',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/10.mp3',
      errorMessage: '',
    })
  })
})
