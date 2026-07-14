import type {
  CreateResourceAssetInput,
  ResourceAsset,
  ResourceLibraryState,
  UpdateResourceAssetInput,
} from '@/types/resource'

export type {
  CreateResourceAssetInput,
  ResourceAsset,
  ResourceAssetSource,
  ResourceAssetType,
  ResourceLibraryState,
  UpdateResourceAssetInput,
} from '@/types/resource'

export interface ResourceApiContract {
  getLibrary(): Promise<ResourceLibraryState>
  createAsset(input: CreateResourceAssetInput): Promise<ResourceAsset>
  updateAsset(assetId: string, input: UpdateResourceAssetInput): Promise<ResourceAsset | null>
  removeAsset(assetId: string): Promise<void>
}
