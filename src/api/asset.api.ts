import type { Asset } from '@/types/asset'
import { delay, readLocal, writeLocal } from './local'

const ASSET_KEY = 'amd.assets.byProject'

type AssetMap = Record<string, Asset[]>

const getAssetMap = (): AssetMap => readLocal<AssetMap>(ASSET_KEY, {})
const setAssetMap = (map: AssetMap): void => writeLocal(ASSET_KEY, map)

export const assetApi = {
  async list(projectId: string): Promise<Asset[]> {
    await delay()
    return getAssetMap()[projectId] ?? []
  },

  async save(projectId: string, assets: Asset[]): Promise<Asset[]> {
    await delay(80)
    const map = getAssetMap()
    map[projectId] = assets
    setAssetMap(map)
    return assets
  },
}
