import { http } from '@/api/http'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceApiContract, VoiceAsset } from './voice.types'

const normalizeVoice = (value: unknown): VoiceAsset => {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    id: String(record.id ?? ''),
    name: typeof record.name === 'string' ? record.name : '',
    audioUrl: typeof record.audioUrl === 'string' ? record.audioUrl : '',
    duration: typeof record.duration === 'number' ? record.duration : 0,
    createdAt:
      typeof record.createdAt === 'string'
        ? record.createdAt
        : typeof record.createTime === 'string'
          ? record.createTime
          : typeof record.updateTime === 'string'
            ? record.updateTime
            : '',
  }
}

export const voiceHttpApi: VoiceApiContract = {
  async list() {
    const { data } = await http.get('/voices')
    return Array.isArray(data.voices) ? data.voices.map(normalizeVoice) : []
  },

  async create(input: CreateVoiceAssetInput) {
    const { data } = await http.post('/voices', input)
    return normalizeVoice(data.voice)
  },

  async update(voiceId: string, input: UpdateVoiceAssetInput) {
    const { data } = await http.patch(`/voices/${voiceId}`, input)
    return data.voice ? normalizeVoice(data.voice) : null
  },

  async remove(voiceId: string) {
    await http.delete(`/voices/${voiceId}`)
  },
}
