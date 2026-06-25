import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLocalState } from '@/api/local'
import { createDefaultSettingAssets } from '@/mocks/setting.mock'
import { API_ERROR_CODES } from '@/types/api-enums'

describe('settingAssetGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
    vi.resetModules()
  })

  it('generates a setting asset image through generation tasks', async () => {
    const { settingAssetGenerationService } = await import('@/services/generation/settingAssetGeneration.service')
    const asset = createDefaultSettingAssets()[0]!

    const result = await settingAssetGenerationService.generateAssetImage({
      projectId: 'setting-service-project',
      asset,
    })

    expect(result.assetId).toBe(asset.id)
    expect(result.imageUrl).toContain('data:image/svg+xml')
    expect(result.asset.imageUrls[0]).toBe(result.imageUrl)
    expect(result.asset.status).toBe('ready')
  })

  it('throws a stable error when setting image generation fails', async () => {
    const { settingAssetGenerationService } = await import('@/services/generation/settingAssetGeneration.service')
    const asset = createDefaultSettingAssets()[0]!
    asset.prompt = '#mock-image-fail'

    await expect(
      settingAssetGenerationService.generateAssetImage({
        projectId: 'setting-service-project',
        asset,
      }),
    ).rejects.toThrow(API_ERROR_CODES.settingImageGenerateFailed)
  })

  it('uses direct asset task generation in http mode and refreshes workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const asset = {
      ...createDefaultSettingAssets()[0]!,
      id: '101',
    }
    const refreshedAsset = {
      ...asset,
      imageUrls: ['/mock-results/aidrama/tasks/9.png'],
      status: 'ready' as const,
    }

    vi.doMock('@/services/editor/assetImageTask.service', () => ({
      assetImageTaskService: {
        createAssetImageTask: vi.fn().mockResolvedValue({
          id: '9',
          status: 'SUCCESS',
          progress: 100,
          providerTaskId: '',
          resultUrl: '/mock-results/aidrama/tasks/9.png',
          errorMessage: '',
        }),
      },
    }))

    vi.doMock('@/services/editor/assetWorkflow.service', () => ({
      assetWorkflowService: {
        loadAssetWorkspace: vi.fn().mockResolvedValue([refreshedAsset]),
      },
    }))

    const { settingAssetGenerationService } = await import('@/services/generation/settingAssetGeneration.service')

    const result = await settingAssetGenerationService.generateAssetImage({
      projectId: 'setting-service-project',
      asset,
    })

    expect(result).toMatchObject({
      assetId: asset.id,
      imageUrl: '/mock-results/aidrama/tasks/9.png',
      asset: refreshedAsset,
    })
  })
})
