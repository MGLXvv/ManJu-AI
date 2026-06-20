import { describe, expect, it } from 'vitest'
import { settingApi } from '@/api/modules/setting/setting.api'

describe('modules/setting settingApi', () => {
  it('normalizes non-character voice fields away on update', async () => {
    const created = await settingApi.createAsset({
      type: 'scene',
      title: 'Harbor',
      description: 'Foggy harbor at dawn',
      prompt: 'Cinematic harbor with heavy mist',
      voiceId: 'voice-1',
      voiceName: 'Should Not Persist',
    })

    expect(created.voiceId).toBeUndefined()
    expect(created.voiceOptions).toBeUndefined()

    const updated = await settingApi.updateAsset(created, {
      voiceId: 'voice-2',
      voiceName: 'Still Ignored',
      selectedVoiceId: 'voice-2',
    })

    expect(updated.voiceId).toBeUndefined()
    expect(updated.voiceName).toBeUndefined()
    expect(updated.selectedVoiceId).toBeUndefined()
    expect(updated.voiceOptions).toBeUndefined()
  })

  it('returns a generated image result with updated asset state', async () => {
    const created = await settingApi.createAsset({
      type: 'prop',
      title: 'Ancient Compass',
      description: 'An old brass compass',
      prompt: 'Detailed brass compass on dark velvet',
    })

    const result = await settingApi.generateAssetImage(created)

    expect(result.imageUrl).toContain('data:image/svg+xml')
    expect(result.asset.status).toBe('ready')
    expect(result.asset.imageUrls[0]).toBe(result.imageUrl)
  })
})
