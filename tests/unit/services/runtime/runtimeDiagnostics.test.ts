import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearRuntimeErrors,
  getCurrentRuntimeError,
  getRuntimeDiagnostics,
  reportRuntimeError,
  resetRuntimeDiagnostics,
  subscribeRuntimeErrors,
} from '@/services/runtime/runtimeDiagnostics'

describe('runtime diagnostics', () => {
  beforeEach(() => {
    resetRuntimeDiagnostics()
  })

  it('publishes sanitized diagnostics to subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRuntimeErrors(listener)

    const diagnostic = reportRuntimeError(new Error('Bearer private-token'), {
      code: 'TEST_ERROR',
      category: 'runtime',
      context: { token: 'secret', route: '/projects/1' },
      now: () => 1_000,
    })

    expect(listener).toHaveBeenNthCalledWith(1, null)
    expect(listener).toHaveBeenNthCalledWith(2, diagnostic)
    expect(diagnostic.message).toBe('Bearer [REDACTED]')
    expect(diagnostic.context).toEqual({ token: '[REDACTED]', route: '/projects/1' })
    expect(getCurrentRuntimeError()).toBe(diagnostic)
    unsubscribe()
  })

  it('deduplicates repeated errors inside the reporting window', () => {
    const first = reportRuntimeError(new Error('same failure'), {
      code: 'SAME_FAILURE',
      now: () => 1_000,
    })
    const second = reportRuntimeError(new Error('same failure'), {
      code: 'SAME_FAILURE',
      now: () => 2_000,
    })

    expect(second).toBe(first)
    expect(getRuntimeDiagnostics()).toHaveLength(1)
  })

  it('keeps a bounded diagnostic history and can dismiss all errors', () => {
    for (let index = 0; index < 25; index += 1) {
      reportRuntimeError(new Error(`failure-${index}`), {
        code: `ERROR_${index}`,
        now: () => index * 2_000,
      })
    }

    expect(getRuntimeDiagnostics()).toHaveLength(20)
    clearRuntimeErrors()
    expect(getRuntimeDiagnostics()).toEqual([])
    expect(getCurrentRuntimeError()).toBeNull()
  })
})
