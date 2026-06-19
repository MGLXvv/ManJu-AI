import { isMockMode } from '@/api/shared/apiMode'
import { scriptTemplateHttpApi } from './scriptTemplate.http'
import { scriptTemplateMockApi } from './scriptTemplate.mock'

export const scriptTemplateApi = isMockMode ? scriptTemplateMockApi : scriptTemplateHttpApi
