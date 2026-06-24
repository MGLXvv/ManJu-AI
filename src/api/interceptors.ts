import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { isCommonResult } from './commonResult'
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
    async (response) => {
      const body = response.data

      if (isCommonResult(body)) {
        if (body.code === 401) {
          options.onUnauthorized()
        }

        if (body.code === 403) {
          options.onForbidden()
        }

        if (body.code !== 0) {
          throw createApiError({
            message: body.msg || 'Request failed',
            code: String(body.code),
            status: response.status,
            details: body,
          })
        }

        response.data = body.data
      }

      return response
    },
    (error) => {
      const status = error?.response?.status as number | undefined
      const responseBody = error?.response?.data

      if (status === 401) {
        options.onUnauthorized()
      }

      if (status === 403) {
        options.onForbidden()
      }

      throw createApiError({
        message: responseBody?.msg ?? responseBody?.message ?? error?.message ?? 'Request failed',
        code: responseBody?.code ? String(responseBody.code) : 'HTTP_REQUEST_FAILED',
        status,
        details: responseBody,
      })
    },
  )
}
