import { isMockMode } from '@/api/shared/apiMode'
import { projectHttpApi } from './project.http'
import { projectMockApi } from './project.mock'

export const projectApi = isMockMode ? projectMockApi : projectHttpApi
