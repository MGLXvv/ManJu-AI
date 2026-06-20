import { describe, expect, it } from 'vitest'
import { settingApi } from '@/api/setting.api'
import { settingApi as moduleSettingApi } from '@/api/modules/setting'

describe('setting api', () => {
  it('re-exports the module-level setting api for compatibility', () => {
    expect(settingApi).toBe(moduleSettingApi)
  })

  it('returns default assets and preserves selected default voice for character assets', async () => {
    const defaults = await settingApi.listDefaults()
    expect(defaults.length).toBeGreaterThan(0)

    const created = await settingApi.createAsset({
      type: 'character',
      title: 'Test Character',
      roleName: 'Bodyguard',
      description: 'Calm and reliable character setup',
      prompt: 'A serious bodyguard in uniform',
      voiceId: 'voice-1',
      voiceName: 'Existing Voice',
    })

    expect(created.status).toBe('empty')
    expect(created.roleName).toBe('Bodyguard')
    expect(created.description).toBe('Calm and reliable character setup')
    expect(created.voiceId).toBe('voice-1')
    expect(created.voiceName).toBeTruthy()
    expect(created.selectedVoiceId).toBe('voice-1')

    const uploaded = await settingApi.uploadAssetImage(created, 'data:image/png;base64,test')
    expect(uploaded.imageUrls[0]).toContain('data:image/png')

    const selected = await settingApi.selectCandidateImage(uploaded, uploaded.imageUrls[0])
    expect(selected.status).toBe('ready')
  })
})
