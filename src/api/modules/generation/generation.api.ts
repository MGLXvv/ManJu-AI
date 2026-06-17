import { isMockMode } from '@/api/shared/apiMode'
import { generationHttpApi } from './generation.http'
import { generationMockApi } from './generation.mock'

export const generationApi = isMockMode ? generationMockApi : generationHttpApi
