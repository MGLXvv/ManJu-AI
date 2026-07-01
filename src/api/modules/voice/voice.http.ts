import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceApiContract } from './voice.types'

export const voiceHttpApi: VoiceApiContract = {
  async list() {
    const { data } = await http.get('/voices')
    return Array.isArray(data.voices) ? data.voices : []
  },

  async create(_input: CreateVoiceAssetInput) {
    throw createApiError({
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
      message: 'Voice write operations are not available in the current HTTP phase.',
    })
  },

  async update(_voiceId: string, _input: UpdateVoiceAssetInput) {
    throw createApiError({
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
      message: 'Voice write operations are not available in the current HTTP phase.',
    })
  },

  async remove(_voiceId: string) {
    throw createApiError({
      code: API_ERROR_CODES.voiceHttpWriteUnsupported,
      message: 'Voice write operations are not available in the current HTTP phase.',
    })
  },
}
