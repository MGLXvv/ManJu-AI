export interface ApiResponse<T> {
  code: number | string
  message: string
  data: T
  success?: boolean
  traceId?: string
}

export interface ApiListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorShape {
  code: string
  message: string
  status?: number
  details?: unknown
}
