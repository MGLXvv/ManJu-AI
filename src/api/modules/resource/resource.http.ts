import { http } from '@/api/http'
import type { CreateResourceAssetInput, ResourceApiContract, UpdateResourceAssetInput } from './resource.types'

export const resourceHttpApi: ResourceApiContract = {
  async getLibrary() {
    const { data } = await http.get('/resources')
    return data
  },

  async createAsset(input: CreateResourceAssetInput) {
    const { data } = await http.post('/resources', input)
    return data.asset
  },

  async updateAsset(assetId: string, input: UpdateResourceAssetInput) {
    const { data } = await http.patch(`/resources/${assetId}`, input)
    return data.asset
  },

  async removeAsset(assetId: string) {
    await http.delete(`/resources/${assetId}`)
  },
}
