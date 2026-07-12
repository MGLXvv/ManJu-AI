import { describe, expect, it } from 'vitest'
import { AppError, normalizeAppError, redactDiagnosticText, sanitizeDiagnosticValue } from '@/services/runtime/appError'

describe('app error', () => {
  it('normalizes unknown errors with a safe fallback', () => {
    const error = normalizeAppError(new Error('request failed with Bearer secret-token'), {
      code: 'REQUEST_FAILED',
      category: 'network',
      recoverable: false,
    })

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: 'REQUEST_FAILED',
      category: 'network',
      recoverable: false,
      message: 'request failed with Bearer [REDACTED]',
    })
  })

  it('preserves structured error codes and valid categories', () => {
    const error = normalizeAppError({
      code: 'STORAGE_READ_FAILED',
      category: 'storage',
      message: 'cannot read cache',
    })

    expect(error).toMatchObject({
      code: 'STORAGE_READ_FAILED',
      category: 'storage',
      message: 'cannot read cache',
    })
  })

  it('redacts sensitive keys, bearer tokens, JWT values, and circular references', () => {
    const circular: Record<string, unknown> = {
      authorization: 'Bearer top-secret',
      nested: {
        password: '123456',
        note: 'Bearer visible-token',
        jwt: 'eyJabc.def.ghi',
      },
    }
    circular.self = circular

    const sanitized = sanitizeDiagnosticValue(circular) as Record<string, unknown>
    expect(sanitized.authorization).toBe('[REDACTED]')
    expect(sanitized.self).toBe('[CIRCULAR]')
    expect(sanitized.nested).toEqual({
      password: '[REDACTED]',
      note: 'Bearer [REDACTED]',
      jwt: '[REDACTED_JWT]',
    })
  })

  it('redacts bearer credentials from standalone text', () => {
    expect(redactDiagnosticText('Authorization: Bearer abc.def')).toBe('Authorization: Bearer [REDACTED]')
  })
})
