import { createLatestRequestGuard } from './latestRequestState'

export type LatestAsyncTaskResult<T> = { status: 'accepted'; value: T } | { status: 'stale' }

export interface LatestAsyncTaskRunner {
  run<T>(task: () => Promise<T>): Promise<LatestAsyncTaskResult<T>>
  invalidate(): void
}

export const createLatestAsyncTaskRunner = (): LatestAsyncTaskRunner => {
  const guard = createLatestRequestGuard()

  return {
    run: async <T>(task: () => Promise<T>): Promise<LatestAsyncTaskResult<T>> => {
      const requestId = guard.start()
      try {
        const value = await task()
        return guard.isCurrent(requestId) ? { status: 'accepted', value } : { status: 'stale' }
      } catch (error) {
        if (!guard.isCurrent(requestId)) {
          return { status: 'stale' }
        }
        throw error
      }
    },
    invalidate: () => guard.invalidate(),
  }
}
