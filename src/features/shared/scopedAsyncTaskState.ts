export type ScopedAsyncTaskResult<T> =
  | {
      status: 'accepted'
      value: T
    }
  | {
      status: 'stale'
    }

export interface ScopedAsyncTaskRunner {
  run<T>(task: () => Promise<T>): Promise<ScopedAsyncTaskResult<T>>
  invalidate(): void
}

export const createScopedAsyncTaskRunner = (): ScopedAsyncTaskRunner => {
  let scopeId = 0

  return {
    run: async <T>(task: () => Promise<T>): Promise<ScopedAsyncTaskResult<T>> => {
      const taskScopeId = scopeId
      try {
        const value = await task()
        return taskScopeId === scopeId ? { status: 'accepted', value } : { status: 'stale' }
      } catch (error) {
        if (taskScopeId !== scopeId) return { status: 'stale' }
        throw error
      }
    },
    invalidate: () => {
      scopeId += 1
    },
  }
}
