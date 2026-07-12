import {
  normalizeAppError,
  sanitizeDiagnosticValue,
  type AppErrorCategory,
  type NormalizeAppErrorFallback,
} from './appError'

export interface RuntimeDiagnostic {
  id: string
  timestamp: string
  code: string
  category: AppErrorCategory
  message: string
  recoverable: boolean
  context?: Record<string, unknown>
}

export type RuntimeDiagnosticListener = (diagnostic: RuntimeDiagnostic | null) => void

const MAX_DIAGNOSTICS = 20
const DEDUPE_WINDOW_MS = 1500

let diagnostics: RuntimeDiagnostic[] = []
let listeners = new Set<RuntimeDiagnosticListener>()
let sequence = 0
let lastSignature = ''
let lastReportedAt = 0

const createId = (now: number): string => `runtime-${now}-${++sequence}`
const createSignature = (diagnostic: Pick<RuntimeDiagnostic, 'code' | 'category' | 'message'>): string =>
  `${diagnostic.category}:${diagnostic.code}:${diagnostic.message}`

const emitCurrent = (): void => {
  const current = diagnostics[0] ?? null
  for (const listener of listeners) {
    listener(current)
  }
}

export interface ReportRuntimeErrorOptions extends NormalizeAppErrorFallback {
  now?: () => number
}

export const reportRuntimeError = (value: unknown, options: ReportRuntimeErrorOptions = {}): RuntimeDiagnostic => {
  const now = options.now?.() ?? Date.now()
  const appError = normalizeAppError(value, options)
  const context = sanitizeDiagnosticValue(appError.context) as Record<string, unknown> | undefined
  const candidate: RuntimeDiagnostic = {
    id: createId(now),
    timestamp: new Date(now).toISOString(),
    code: appError.code,
    category: appError.category,
    message: appError.message,
    recoverable: appError.recoverable,
    ...(context ? { context } : {}),
  }
  const signature = createSignature(candidate)

  if (signature === lastSignature && now - lastReportedAt < DEDUPE_WINDOW_MS && diagnostics[0]) {
    return diagnostics[0]
  }

  lastSignature = signature
  lastReportedAt = now
  diagnostics = [candidate, ...diagnostics].slice(0, MAX_DIAGNOSTICS)
  emitCurrent()
  return candidate
}

export const getCurrentRuntimeError = (): RuntimeDiagnostic | null => diagnostics[0] ?? null

export const getRuntimeDiagnostics = (): RuntimeDiagnostic[] => [...diagnostics]

export const clearCurrentRuntimeError = (): void => {
  if (diagnostics.length === 0) {
    return
  }

  diagnostics = diagnostics.slice(1)
  emitCurrent()
}

export const clearRuntimeErrors = (): void => {
  diagnostics = []
  lastSignature = ''
  lastReportedAt = 0
  emitCurrent()
}

export const subscribeRuntimeErrors = (listener: RuntimeDiagnosticListener, emitImmediately = true): (() => void) => {
  listeners.add(listener)
  if (emitImmediately) {
    listener(getCurrentRuntimeError())
  }

  return () => {
    listeners.delete(listener)
  }
}

export const resetRuntimeDiagnostics = (): void => {
  diagnostics = []
  listeners = new Set<RuntimeDiagnosticListener>()
  sequence = 0
  lastSignature = ''
  lastReportedAt = 0
}
