import { http } from '@/api/http'
import { assertHttpMediaUrl } from '@/services/media'
import type {
  CreateSettingAssetInput,
  GenerateSettingAssetImageResult,
  SettingApiContract,
  SettingAsset,
} from './setting.types'

export const settingHttpApi: SettingApiContract = {
  async listDefaults() {
    const { data } = await http.get('/settings/defaults')
    return data.assets
  },

  async createAsset(input: CreateSettingAssetInput) {
    const { data } = await http.post('/settings/assets', input)
    return data.asset
  },

  async updateAsset(asset: SettingAsset, patch: Partial<SettingAsset>) {
    const { data } = await http.patch(`/settings/assets/${asset.id}`, patch)
    return data.asset
  },

  async uploadAssetImage(asset: SettingAsset, imageUrl: string) {
    assertHttpMediaUrl(imageUrl, {
      targetType: 'setting-asset',
      targetId: asset.id,
      kind: 'image',
    })
    const { data } = await http.post(`/settings/assets/${asset.id}/images`, { imageUrl })
    return data.asset
  },

  async selectCandidateImage(asset: SettingAsset, imageUrl: string) {
    assertHttpMediaUrl(imageUrl, {
      targetType: 'setting-asset',
      targetId: asset.id,
      kind: 'image',
    })
    const { data } = await http.post(`/settings/assets/${asset.id}/candidate-selection`, { imageUrl })
    return data.asset
  },

  async generateAssetImage(asset: SettingAsset): Promise<GenerateSettingAssetImageResult> {
    const { data } = await http.post(`/settings/assets/${asset.id}/generate-image`, { asset })
    return data.result
  },
}
