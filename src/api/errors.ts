import type { ApiErrorCode } from '@/types/api-enums'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number
  details?: unknown

  constructor(input: { message: string; code: ApiErrorCode; status?: number; details?: unknown }) {
    super(input.message)
    this.name = 'ApiError'
    this.code = input.code
    this.status = input.status
    this.details = input.details
  }
}

export const createApiError = (input: {
  message: string
  code: ApiErrorCode
  status?: number
  details?: unknown
}): ApiError => new ApiError(input)

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError
