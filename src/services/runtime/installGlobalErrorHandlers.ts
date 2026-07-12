import type { App } from 'vue'
import { reportRuntimeError } from './runtimeDiagnostics'

export interface RuntimeEventTarget {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void
}

export interface GlobalErrorHandlerOptions {
  target?: RuntimeEventTarget | null
}

export const installGlobalErrorHandlers = (app: App, options: GlobalErrorHandlerOptions = {}): (() => void) => {
  const target = options.target ?? (typeof window !== 'undefined' ? window : null)
  const previousVueHandler = app.config.errorHandler

  const vueHandler: NonNullable<typeof app.config.errorHandler> = (error, instance, info) => {
    reportRuntimeError(error, {
      code: 'VUE_RUNTIME_ERROR',
      category: 'runtime',
      message: '页面运行时发生异常',
      context: {
        info,
        component: instance?.$options.name ?? instance?.$options.__name ?? 'anonymous',
      },
    })
    previousVueHandler?.(error, instance, info)
  }

  const errorListener: EventListener = (event) => {
    const errorEvent = event as ErrorEvent
    reportRuntimeError(errorEvent.error ?? errorEvent.message, {
      code: 'WINDOW_RUNTIME_ERROR',
      category: 'runtime',
      message: '页面脚本执行失败',
      context: {
        filename: errorEvent.filename,
        line: errorEvent.lineno,
        column: errorEvent.colno,
      },
    })
  }

  const rejectionListener: EventListener = (event) => {
    const rejectionEvent = event as PromiseRejectionEvent
    reportRuntimeError(rejectionEvent.reason, {
      code: 'UNHANDLED_PROMISE_REJECTION',
      category: 'runtime',
      message: '异步操作执行失败',
    })
  }

  app.config.errorHandler = vueHandler
  target?.addEventListener('error', errorListener)
  target?.addEventListener('unhandledrejection', rejectionListener)

  return () => {
    if (app.config.errorHandler === vueHandler) {
      app.config.errorHandler = previousVueHandler
    }
    target?.removeEventListener('error', errorListener)
    target?.removeEventListener('unhandledrejection', rejectionListener)
  }
}
