export type MediaKind = 'image' | 'video' | 'audio' | 'file'
export type MediaTargetType =
  | 'setting-asset'
  | 'storyboard-image'
  | 'storyboard-video'
  | 'storyboard-edit'
  | 'dubbing-audio'
  | 'voice-audio'
  | 'resource-asset'
export type MediaStorageKind = 'remote' | 'indexeddb' | 'memory'

export interface MediaUploadContext {
  projectId?: string
  targetType: MediaTargetType
  targetId: string
  kind: MediaKind
}

export interface MediaUploadResult {
  mediaId: string
  url: string
  kind: MediaKind
  mimeType: string
  fileName: string
  size: number
  storage: MediaStorageKind
}

export interface StoredMediaRecord {
  id: string
  blob: Blob
  kind: MediaKind
  mimeType: string
  fileName: string
  size: number
  projectId?: string
  targetType: MediaTargetType
  targetId: string
  createdAt: string
}
