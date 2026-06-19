import { isMockMode } from '@/api/shared/apiMode'
import { systemHttpApi } from './system.http'
import { systemMockApi } from './system.mock'

export const systemApi = isMockMode ? systemMockApi : systemHttpApi
