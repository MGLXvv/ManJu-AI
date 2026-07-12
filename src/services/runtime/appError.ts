export type AppErrorCategory = 'runtime' | 'network' | 'storage' | 'route' | 'validation'

export interface AppErrorInput {
  code: string
  category: AppErrorCategory
  message: string
  recoverable?: boolean
  cause?: unknown
  context?: Record<string, unknown>
}

export class AppError extends Error {
  readonly code: string
  readonly category: AppErrorCategory
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  override readonly cause?: unknown

  constructor(input: AppErrorInput) {
    super(input.message)
    this.name = 'AppError'
    this.code = input.code
    this.category = input.category
    this.recoverable = input.recoverable ?? true
    this.context = input.context
    this.cause = input.cause
  }
}

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|credential|password|passwd|secret|session|token)/i
const BEARER_PATTERN = /Bearer\s+[^\s,;]+/gi
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
const MAX_SANITIZE_DEPTH = 5
const MAX_COLLECTION_ITEMS = 30

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null

export const redactDiagnosticText = (value: string): string =>
  value.replace(BEARER_PATTERN, 'Bearer [REDACTED]').replace(JWT_PATTERN, '[REDACTED_JWT]')

const sanitizeValue = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (depth > MAX_SANITIZE_DEPTH) {
    return '[MAX_DEPTH]'
  }

  if (typeof value === 'string') {
    return redactDiagnosticText(value)
  }

  if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'undefined') {
    return value
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    return `[${typeof value}]`
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactDiagnosticText(value.message),
    }
  }

  if (seen.has(value)) {
    return '[CIRCULAR]'
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return value.slice(0, MAX_COLLECTION_ITEMS).map((item) => sanitizeValue(item, depth + 1, seen))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value).slice(0, MAX_COLLECTION_ITEMS)) {
    sanitized[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitizeValue(entry, depth + 1, seen)
  }
  return sanitized
}

export const sanitizeDiagnosticValue = (value: unknown): unknown => sanitizeValue(value, 0, new WeakSet<object>())

export interface NormalizeAppErrorFallback {
  code?: string
  category?: AppErrorCategory
  message?: string
  recoverable?: boolean
  context?: Record<string, unknown>
}

export const normalizeAppError = (value: unknown, fallback: NormalizeAppErrorFallback = {}): AppError => {
  if (value instanceof AppError) {
    return value
  }

  const record = asRecord(value)
  const sourceMessage =
    value instanceof Error ? value.message : typeof record?.message === 'string' ? record.message : ''
  const sourceCode = typeof record?.code === 'string' ? record.code : undefined
  const sourceCategory = typeof record?.category === 'string' ? record.category : undefined
  const validCategory =
    sourceCategory === 'runtime' ||
    sourceCategory === 'network' ||
    sourceCategory === 'storage' ||
    sourceCategory === 'route' ||
    sourceCategory === 'validation'
      ? sourceCategory
      : fallback.category

  return new AppError({
    code: sourceCode ?? fallback.code ?? 'UNEXPECTED_RUNTIME_ERROR',
    category: validCategory ?? 'runtime',
    message: redactDiagnosticText(sourceMessage || fallback.message || '发生了未预期的前端异常'),
    recoverable: fallback.recoverable ?? true,
    cause: value,
    context: fallback.context,
  })
}
