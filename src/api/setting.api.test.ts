import { beforeEach, describe, expect, it } from 'vitest'
import { settingApi } from './setting.api'

describe('setting api', () => {
  beforeEach(() => {
    // stateless mock api for now
  })

  it('returns default setting assets and preserves the selected default voice on character assets', async () => {
    const defaults = await settingApi.listDefaults()
    expect(defaults.length).toBeGreaterThan(0)

    const created = await settingApi.createAsset({
      type: 'character',
      title: '测试角色',
      roleName: '冷面保镖',
      description: '沉稳寡言的角色设定',
      prompt: '测试提示词',
      voiceId: 'voice-1',
      voiceName: '浑厚男中音',
    })

    expect(created.status).toBe('empty')
    expect(created.roleName).toBe('冷面保镖')
    expect(created.description).toBe('沉稳寡言的角色设定')
    expect(created.voiceId).toBe('voice-1')
    expect(created.voiceName).toBe('浑厚男中音')

    const uploaded = await settingApi.uploadAssetImage(created, 'data:image/png;base64,test')
    expect(uploaded.imageUrls[0]).toContain('data:image/png')

    const selected = await settingApi.selectCandidateImage(uploaded, uploaded.imageUrls[0])
    expect(selected.status).toBe('ready')
  })
})
