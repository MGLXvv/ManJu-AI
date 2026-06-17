import { isMockMode } from '@/api/shared/apiMode'
import { resourceHttpApi } from './resource.http'
import { resourceMockApi } from './resource.mock'

export const resourceApi = isMockMode ? resourceMockApi : resourceHttpApi
