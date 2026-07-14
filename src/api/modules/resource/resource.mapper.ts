import type { BackendAssetType, BackendResourceLibraryItemDTO } from '@/types/api-dto'
import type {
  CreateResourceAssetInput,
  ResourceAsset,
  ResourceAssetSource,
  ResourceAssetType,
  UpdateResourceAssetInput,
} from './resource.types'

interface ResourceExtraMeta {
  prompt?: unknown
  favorite?: unknown
  selectedVoiceId?: unknown
}

export interface BackendResourceAssetPayload {
  assetType?: BackendAssetType
  name?: string
  description?: string
  imageUrl?: string
  extraJson?: string
  scope?: 'PRIVATE' | 'SYSTEM' | 'SHARED'
}

const backendTypeToResourceType: Record<BackendAssetType, ResourceAssetType> = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop',
}

const resourceTypeToBackendType: Record<ResourceAssetType, BackendAssetType> = {
  character: 'CHARACTER',
  scene: 'SCENE',
  prop: 'PROP',
}

const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key)

const parseExtraMeta = (extraJson?: string | null): ResourceExtraMeta => {
  if (!extraJson) return {}

  try {
    return JSON.parse(extraJson) as ResourceExtraMeta
  } catch {
    return {}
  }
}

const mapBackendScopeToSource = (scope: string | null | undefined, favorite: boolean): ResourceAssetSource => {
  if (favorite) return 'favorite'
  return scope === 'SYSTEM' || scope === 'SHARED' ? 'official' : 'created'
}

const mapResourceSourceToBackendScope = (
  source: ResourceAssetSource | undefined,
): BackendResourceAssetPayload['scope'] => (source === 'official' ? 'SYSTEM' : 'PRIVATE')

export const mapBackendResourceAsset = (item: BackendResourceLibraryItemDTO): ResourceAsset => {
  if (item.id === null || item.id === undefined || item.id === '') {
    throw new Error('RESOURCE_ENTITY_ID_MISSING')
  }

  const extra = parseExtraMeta(item.extraJson)
  const favorite = extra.favorite === true
  const source = mapBackendScopeToSource(item.scope, favorite)
  const backendType = item.assetType ?? item.type ?? 'SCENE'
  const type = backendTypeToResourceType[backendType]

  if (!type) {
    throw new Error(`RESOURCE_ASSET_TYPE_UNSUPPORTED:${String(backendType)}`)
  }

  return {
    id: String(item.id),
    tab: source === 'official' ? 'subject' : 'creative',
    type,
    source,
    name: item.name,
    prompt: typeof extra.prompt === 'string' ? extra.prompt : '',
    imageUrl: item.imageUrl ?? '',
    selectedVoiceId: typeof extra.selectedVoiceId === 'string' ? extra.selectedVoiceId : undefined,
  }
}

export const mapCreateResourceInputToBackendPayload = (
  input: CreateResourceAssetInput,
): BackendResourceAssetPayload => ({
  assetType: resourceTypeToBackendType[input.type],
  name: input.name,
  description: '',
  imageUrl: input.imageUrl,
  scope: mapResourceSourceToBackendScope(input.source),
  extraJson: JSON.stringify({
    prompt: input.prompt,
    favorite: input.source === 'favorite',
    selectedVoiceId: input.selectedVoiceId,
  }),
})

export const mapUpdateResourceInputToBackendPayload = (
  input: UpdateResourceAssetInput,
): BackendResourceAssetPayload => {
  const payload: BackendResourceAssetPayload = {}

  if (input.type !== undefined) payload.assetType = resourceTypeToBackendType[input.type]
  if (input.name !== undefined) payload.name = input.name
  if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl
  if (input.source !== undefined) payload.scope = mapResourceSourceToBackendScope(input.source)

  const touchesExtraMeta = hasOwn(input, 'prompt') || hasOwn(input, 'source') || hasOwn(input, 'selectedVoiceId')

  if (touchesExtraMeta) {
    if (input.prompt === undefined || input.source === undefined) {
      throw new Error('RESOURCE_EXTRA_META_UPDATE_INCOMPLETE')
    }

    payload.extraJson = JSON.stringify({
      prompt: input.prompt,
      favorite: input.source === 'favorite',
      selectedVoiceId: input.selectedVoiceId,
    })
  }

  return payload
}
