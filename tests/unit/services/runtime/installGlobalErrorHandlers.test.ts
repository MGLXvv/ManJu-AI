import { createApp } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { installGlobalErrorHandlers } from '@/services/runtime/installGlobalErrorHandlers'
import {
  getRuntimeDiagnostics,
  resetRuntimeDiagnostics,
} from '@/services/runtime/runtimeDiagnostics'

describe('global runtime error handlers', () => {
  beforeEach(() => {
    resetRuntimeDiagnostics()
  })

  it('captures Vue, window, and unhandled promise errors', () => {
    const app = createApp({})
    const target = new EventTarget()
    const uninstall = installGlobalErrorHandlers(app, { target })

    app.config.errorHandler?.(new Error('render failed'), null, 'render function')

    const windowError = Object.assign(new Event('error'), {
      error: new Error('window failed'),
      filename: 'app.js',
      lineno: 10,
      colno: 20,
      message: 'window failed',
    })
    target.dispatchEvent(windowError)

    const rejection = Object.assign(new Event('unhandledrejection'), {
      reason: new Error('promise failed'),
    })
    target.dispatchEvent(rejection)

    expect(getRuntimeDiagnostics().map((item) => item.code)).toEqual([
      'UNHANDLED_PROMISE_REJECTION',
      'WINDOW_RUNTIME_ERROR',
      'VUE_RUNTIME_ERROR',
    ])

    uninstall()
  })

  it('removes event listeners and restores the previous Vue handler', () => {
    const app = createApp({})
    const target = new EventTarget()
    const previousHandler = () => undefined
    app.config.errorHandler = previousHandler

    const uninstall = installGlobalErrorHandlers(app, { target })
    uninstall()

    expect(app.config.errorHandler).toBe(previousHandler)
    target.dispatchEvent(
      Object.assign(new Event('error'), {
        error: new Error('ignored'),
      }),
    )
    expect(getRuntimeDiagnostics()).toEqual([])
  })
})
