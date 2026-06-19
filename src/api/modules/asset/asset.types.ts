import type { Asset } from '@/types/asset'

export type { Asset } from '@/types/asset'

export interface AssetApiContract {
  list(projectId: string): Promise<Asset[]>
  save(projectId: string, assets: Asset[]): Promise<Asset[]>
}
