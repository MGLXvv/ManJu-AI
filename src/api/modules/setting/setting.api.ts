import { isMockMode } from '@/api/shared/apiMode'
import { settingHttpApi } from './setting.http'
import { settingMockApi } from './setting.mock'

export const settingApi = isMockMode ? settingMockApi : settingHttpApi
