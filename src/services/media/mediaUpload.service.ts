import { createApiError } from '@/api/errors'
import { apiMode } from '@/api/shared/apiMode'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { EditorDraft } from '@/types/editor'
import type { MediaKind, MediaStorageKind, MediaUploadContext, MediaUploadResult, StoredMediaRecord } from '@/types/media'
import type { ResourceAsset } from '@/types/resource'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardImageEditRecord, StoryboardReferenceImage, StoryboardShot } from '@/types/storyboard'
import { mediaBlobRepository } from './mediaBlobRepository'

const createMediaId = (): string =>
  `media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const isTransientMediaUrl = (value?: string | null): boolean =>
  Boolean(value && (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('mock-media://')))

const dataUrlToBlob = (dataUrl: string): Blob => {
  const separatorIndex = dataUrl.indexOf(',')
  if (separatorIndex < 0) {
    throw new Error('INVALID_DATA_URL')
  }

  const metadata = dataUrl.slice(5, separatorIndex)
  const payload = dataUrl.slice(separatorIndex + 1)
  const mimeType = metadata.split(';')[0] || 'application/octet-stream'
  const isBase64 = metadata.includes(';base64')
  const binary = isBase64 ? atob(payload) : decodeURIComponent(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mimeType })
}

const resolveUrl = async (mediaId: string | undefined, currentUrl: string | undefined): Promise<string> => {
  if (!mediaId) {
    return currentUrl ?? ''
  }
  const restored = await mediaBlobRepository.resolveUrl(mediaId)
  return restored || currentUrl || ''
}

const hydrateReference = async (reference: StoryboardReferenceImage): Promise<StoryboardReferenceImage> => ({
  ...reference,
  url: await resolveUrl(reference.mediaId, reference.url),
})

const hydrateEditRecord = async (record: StoryboardImageEditRecord): Promise<StoryboardImageEditRecord> => ({
  ...record,
  sourceImageUrl: await resolveUrl(record.sourceMediaId, record.sourceImageUrl),
  resultImageUrl: await resolveUrl(record.resultMediaId, record.resultImageUrl),
})

const hydrateShot = async (shot: StoryboardShot): Promise<StoryboardShot> => ({
  ...shot,
  imageUrl: await resolveUrl(shot.imageMediaId, shot.imageUrl),
  videoUrl: await resolveUrl(shot.videoMediaId, shot.videoUrl),
  referenceImages: await Promise.all((shot.referenceImages ?? []).map(hydrateReference)),
  editHistory: await Promise.all((shot.editHistory ?? []).map(hydrateEditRecord)),
})

const hydrateSettingAsset = async (asset: SettingAsset): Promise<SettingAsset> => {
  const imageUrls = await Promise.all(
    (asset.imageUrls ?? []).map((url, index) => resolveUrl(asset.imageMediaIds?.[index], url)),
  )
  const candidateImages = await Promise.all(
    (asset.candidateImages ?? []).map((url, index) => resolveUrl(asset.candidateMediaIds?.[index], url)),
  )
  return {
    ...asset,
    imageUrls,
    candidateImages,
  }
}

const sanitizeReference = (reference: StoryboardReferenceImage): StoryboardReferenceImage => ({
  ...reference,
  url: isTransientMediaUrl(reference.url) ? '' : reference.url,
})

const sanitizeEditRecord = (record: StoryboardImageEditRecord): StoryboardImageEditRecord => ({
  ...record,
  sourceImageUrl: isTransientMediaUrl(record.sourceImageUrl) ? '' : record.sourceImageUrl,
  resultImageUrl: isTransientMediaUrl(record.resultImageUrl) ? '' : record.resultImageUrl,
})

const sanitizeShot = (shot: StoryboardShot): StoryboardShot => ({
  ...shot,
  imageUrl: isTransientMediaUrl(shot.imageUrl) ? '' : shot.imageUrl,
  videoUrl: isTransientMediaUrl(shot.videoUrl) ? '' : shot.videoUrl,
  referenceImages: (shot.referenceImages ?? []).map(sanitizeReference),
  editHistory: (shot.editHistory ?? []).map(sanitizeEditRecord),
})

const sanitizeSettingAsset = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: (asset.imageUrls ?? []).map((url) => (isTransientMediaUrl(url) ? '' : url)),
  candidateImages: (asset.candidateImages ?? []).map((url) => (isTransientMediaUrl(url) ? '' : url)),
})

const buildUploadResult = (
  record: StoredMediaRecord,
  url: string,
  storage: MediaStorageKind,
): MediaUploadResult => ({
  mediaId: record.id,
  url,
  kind: record.kind,
  mimeType: record.mimeType,
  fileName: record.fileName,
  size: record.size,
  storage,
})

export class MediaUploadService {
  constructor(private readonly mode: 'mock' | 'http' = apiMode) {}

  async upload(file: Blob, context: MediaUploadContext, fileName = 'upload'): Promise<MediaUploadResult> {
    if (this.mode !== 'mock') {
      throw createApiError({
        code: API_ERROR_CODES.mediaUploadHttpUnsupported,
        message: 'Media upload endpoint is not configured for HTTP mode.',
        status: 501,
        details: context,
      })
    }

    const mediaId = createMediaId()
    const record: StoredMediaRecord = {
      id: mediaId,
      blob: file,
      kind: context.kind,
      mimeType: file.type || 'application/octet-stream',
      fileName,
      size: file.size,
      projectId: context.projectId,
      targetType: context.targetType,
      targetId: context.targetId,
      createdAt: new Date().toISOString(),
    }
    const storage = await mediaBlobRepository.save(record)
    const url = await mediaBlobRepository.resolveUrl(mediaId)
    return buildUploadResult(record, url, storage)
  }

  uploadFile(file: File, context: MediaUploadContext): Promise<MediaUploadResult> {
    return this.upload(file, context, file.name)
  }

  uploadDataUrl(
    dataUrl: string,
    context: MediaUploadContext,
    fileName = 'generated.svg',
  ): Promise<MediaUploadResult> {
    return this.upload(dataUrlToBlob(dataUrl), context, fileName)
  }

  async captureUrl(
    url: string,
    context: MediaUploadContext,
    fileName = 'upload',
  ): Promise<MediaUploadResult | null> {
    if (!isTransientMediaUrl(url)) {
      return null
    }

    const existingId = mediaBlobRepository.findIdByUrl(url)
    if (existingId) {
      const existing = await mediaBlobRepository.get(existingId)
      if (existing) {
        const restoredUrl = await mediaBlobRepository.resolveUrl(existingId)
        return buildUploadResult(existing, restoredUrl, typeof indexedDB === 'undefined' ? 'memory' : 'indexeddb')
      }
    }

    if (url.startsWith('data:')) {
      return this.uploadDataUrl(url, context, fileName)
    }

    if (url.startsWith('blob:')) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('MEDIA_BLOB_READ_FAILED')
      }
      return this.upload(await response.blob(), context, fileName)
    }

    return null
  }

  restore(mediaId: string): Promise<string> {
    return mediaBlobRepository.resolveUrl(mediaId)
  }
}

export const sanitizeEditorDraftMedia = (draft: EditorDraft): EditorDraft => {
  const next = cloneJson(draft)
  next.settingAssets = next.settingAssets.map(sanitizeSettingAsset)
  next.shots = next.shots.map(sanitizeShot)
  return next
}

export const hydrateEditorDraftMedia = async (draft: EditorDraft): Promise<EditorDraft> => {
  const next = cloneJson(draft)
  next.settingAssets = await Promise.all(next.settingAssets.map(hydrateSettingAsset))
  next.shots = await Promise.all(next.shots.map(hydrateShot))
  return next
}

export const sanitizeResourceAssetMedia = (asset: ResourceAsset): ResourceAsset => ({
  ...asset,
  imageUrl: isTransientMediaUrl(asset.imageUrl) ? '' : asset.imageUrl,
})

export const hydrateResourceAssetMedia = async (asset: ResourceAsset): Promise<ResourceAsset> => ({
  ...asset,
  imageUrl: await resolveUrl(asset.imageMediaId, asset.imageUrl),
})

export const mediaUploadService = new MediaUploadService()
export type { MediaKind }
