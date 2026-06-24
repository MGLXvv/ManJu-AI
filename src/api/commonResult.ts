export interface CommonResult<T> {
  code: number
  msg: string
  data: T
}

export const isCommonResult = (value: unknown): value is CommonResult<unknown> => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.code === 'number' && 'data' in record
}
