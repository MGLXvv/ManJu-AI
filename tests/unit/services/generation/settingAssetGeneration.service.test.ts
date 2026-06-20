import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { createDefaultSettingAssets } from '@/mocks/setting.mock'
import { API_ERROR_CODES } from '@/types/api-enums'
import { settingAssetGenerationService } from '@/services/generation/settingAssetGeneration.service'

describe('settingAssetGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('generates a setting asset image through generation tasks', async () => {
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
    const asset = createDefaultSettingAssets()[0]!
    asset.prompt = '#mock-image-fail'

    await expect(
      settingAssetGenerationService.generateAssetImage({
        projectId: 'setting-service-project',
        asset,
      }),
    ).rejects.toThrow(API_ERROR_CODES.settingImageGenerateFailed)
  })
})
