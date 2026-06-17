import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { createApiError } from './errors'

interface AttachInterceptorOptions {
  getToken: () => string | null
  onUnauthorized: () => void
  onForbidden: () => void
}

export const attachInterceptors = (client: AxiosInstance, options: AttachInterceptorOptions): void => {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = options.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Requested-With'] = 'XMLHttpRequest'
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status as number | undefined

      if (status === 401) {
        options.onUnauthorized()
      }

      if (status === 403) {
        options.onForbidden()
      }

      throw createApiError({
        message: error?.response?.data?.message ?? error?.message ?? 'Request failed',
        code: error?.response?.data?.code ?? 'HTTP_REQUEST_FAILED',
        status,
        details: error?.response?.data,
      })
    },
  )
}
