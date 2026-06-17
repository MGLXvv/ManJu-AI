import { http } from '@/api/http'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceApiContract } from './voice.types'

export const voiceHttpApi: VoiceApiContract = {
  async list() {
    const { data } = await http.get('/voices')
    return data.voices
  },

  async create(input: CreateVoiceAssetInput) {
    const { data } = await http.post('/voices', input)
    return data.voice
  },

  async update(voiceId: string, input: UpdateVoiceAssetInput) {
    const { data } = await http.patch(`/voices/${voiceId}`, input)
    return data.voice
  },

  async remove(voiceId: string) {
    await http.delete(`/voices/${voiceId}`)
  },
}
