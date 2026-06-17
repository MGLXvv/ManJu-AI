import { isMockMode } from '@/api/shared/apiMode'
import { voiceHttpApi } from './voice.http'
import { voiceMockApi } from './voice.mock'

export const voiceApi = isMockMode ? voiceMockApi : voiceHttpApi
