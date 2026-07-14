import { http } from '@/api/http'
import { extractBackendEntity, extractBackendList } from '@/api/shared/backendPayload'
import { mapBackendVoiceToVoiceAsset, type BackendVoiceDTO } from './voice.mapper'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceApiContract } from './voice.types'

const VOICES_PATH = '/voices'

/**
 * Phase1 marks Voice Catalog CRUD as a real backend capability.
 * New responses should use direct entities and `data.list`; `voice`/`voices` remain migration aliases until
 * sanitized live fixtures are captured.
 */
export const voiceHttpApi: VoiceApiContract = {
  async list() {
    const { data } = await http.get(VOICES_PATH, {
      params: { pageNo: 1, pageSize: 100 },
    })
    return extractBackendList<BackendVoiceDTO>(data, ['voices']).map(mapBackendVoiceToVoiceAsset)
  },

  async create(input: CreateVoiceAssetInput) {
    const { data } = await http.post(VOICES_PATH, input)
    const voice = extractBackendEntity<BackendVoiceDTO>(data, ['voice'])
    return mapBackendVoiceToVoiceAsset(voice ?? {})
  },

  async update(voiceId: string, input: UpdateVoiceAssetInput) {
    const { data } = await http.patch(`${VOICES_PATH}/${voiceId}`, input)
    const voice = extractBackendEntity<BackendVoiceDTO>(data, ['voice'])
    return voice ? mapBackendVoiceToVoiceAsset(voice) : null
  },

  async remove(voiceId: string) {
    await http.delete(`${VOICES_PATH}/${voiceId}`)
  },
}
