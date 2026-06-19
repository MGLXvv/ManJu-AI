import { http } from '@/api/http'
import type { Asset, AssetApiContract } from './asset.types'

export const assetHttpApi: AssetApiContract = {
  async list(projectId: string) {
    const { data } = await http.get(`/projects/${projectId}/assets`)
    return data.assets
  },

  async save(projectId: string, assets: Asset[]) {
    const { data } = await http.put(`/projects/${projectId}/assets`, { assets })
    return data.assets
  },
}
