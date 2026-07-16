import type { VoiceAsset } from './voice.types'

export interface BackendVoiceDTO {
  id?: string | number | null
  name?: string | null
  audioUrl?: string | null
  audioMediaId?: string | null
  duration?: number | null
  createdAt?: string | null
  createTime?: string | null
  updateTime?: string | null
}

export const mapBackendVoiceToVoiceAsset = (record: BackendVoiceDTO): VoiceAsset => {
  if (record.id === null || record.id === undefined || record.id === '') {
    throw new Error('VOICE_ENTITY_ID_MISSING')
  }

  return {
    id: String(record.id),
    name: record.name ?? '',
    audioUrl: record.audioUrl ?? '',
    audioMediaId: record.audioMediaId ?? undefined,
    duration: typeof record.duration === 'number' ? record.duration : 0,
    createdAt: record.createdAt ?? record.createTime ?? record.updateTime ?? '',
  }
}
