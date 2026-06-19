import { isMockMode } from '@/api/shared/apiMode'
import { assetHttpApi } from './asset.http'
import { assetMockApi } from './asset.mock'

export const assetApi = isMockMode ? assetMockApi : assetHttpApi
