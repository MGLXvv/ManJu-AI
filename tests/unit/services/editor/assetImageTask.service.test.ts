import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
  },
}))

describe('assetImageTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { assetImageTaskService } = await import('@/services/editor/assetImageTask.service')
    const result = await assetImageTaskService.createAssetImageTask('1')

    expect(result).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
  })

  it('creates asset image task in http mode with empty json body when prompt is missing', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        id: 2,
        status: 'SUCCESS',
        progress: 100,
        resultUrl: '/mock-results/aidrama/tasks/2.png',
      },
    })

    const { assetImageTaskService } = await import('@/services/editor/assetImageTask.service')
    const result = await assetImageTaskService.createAssetImageTask('1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/assets/1/generate-image', {})
    expect(result).toMatchObject({
      id: '2',
      status: 'SUCCESS',
      progress: 100,
      resultUrl: '/mock-results/aidrama/tasks/2.png',
    })
  })

  it('sends prompt body when prompt exists', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        taskId: 5,
        status: 'RUNNING',
        progress: 20,
      },
    })

    const { assetImageTaskService } = await import('@/services/editor/assetImageTask.service')
    await assetImageTaskService.createAssetImageTask('7', 'anime hero')

    expect(http.post).toHaveBeenCalledWith('/aidrama/assets/7/generate-image', {
      prompt: 'anime hero',
    })
  })

  it('trims prompt before sending request body', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        taskId: 6,
        status: 'RUNNING',
        progress: 10,
      },
    })

    const { assetImageTaskService } = await import('@/services/editor/assetImageTask.service')
    await assetImageTaskService.createAssetImageTask('7', '  anime hero  ')

    expect(http.post).toHaveBeenCalledWith('/aidrama/assets/7/generate-image', {
      prompt: 'anime hero',
    })
  })
})
