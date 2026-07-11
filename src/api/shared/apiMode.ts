import { runtimeConfig, type ApiMode } from '@/config/runtimeConfig'

export type { ApiMode }

export const apiMode: ApiMode = runtimeConfig.apiMode
export const isMockMode = apiMode === 'mock'
