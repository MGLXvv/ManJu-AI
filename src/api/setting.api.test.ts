import { beforeEach, describe, expect, it } from 'vitest'
import { settingApi } from './setting.api'

describe('setting api', () => {
  beforeEach(() => {
    // stateless mock api for now
  })

  it('returns default setting assets and supports local transformations', async () => {
    const defaults = await settingApi.listDefaults()
    expect(defaults.length).toBeGreaterThan(0)

    const created = await settingApi.createAsset({
      type: 'character',
      title: '测试角色',
      prompt: '测试提示词',
    })
    expect(created.status).toBe('empty')

    const uploaded = await settingApi.uploadAssetImage(created, 'data:image/png;base64,test')
    expect(uploaded.imageUrls[0]).toContain('data:image/png')

    const selected = await settingApi.selectCandidateImage(uploaded, uploaded.imageUrls[0])
    expect(selected.status).toBe('ready')
  })
})
