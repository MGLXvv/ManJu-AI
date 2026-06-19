import { delay, readLocal, writeLocal } from '@/api/local'
import type { Asset, AssetApiContract } from './asset.types'

const ASSET_KEY = 'amd.assets.byProject'

type AssetMap = Record<string, Asset[]>

const getAssetMap = (): AssetMap => readLocal<AssetMap>(ASSET_KEY, {})
const setAssetMap = (map: AssetMap): void => writeLocal(ASSET_KEY, map)

export const assetMockApi: AssetApiContract = {
  async list(projectId: string) {
    await delay()
    return getAssetMap()[projectId] ?? []
  },

  async save(projectId: string, assets: Asset[]) {
    await delay(80)
    const map = getAssetMap()
    map[projectId] = assets
    setAssetMap(map)
    return assets
  },
}
