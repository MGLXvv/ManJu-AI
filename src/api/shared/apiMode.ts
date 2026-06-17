export type ApiMode = 'mock' | 'http'

export const apiMode: ApiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'

export const isMockMode = apiMode === 'mock'
