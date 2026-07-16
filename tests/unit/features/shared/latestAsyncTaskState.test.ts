import { describe, expect, it } from 'vitest'
import { createLatestAsyncTaskRunner } from '@/features/shared/latestAsyncTaskState'

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('latestAsyncTaskState', () => {
  it('accepts the latest completed task', async () => {
    const runner = createLatestAsyncTaskRunner()
    await expect(runner.run(async () => 'latest')).resolves.toEqual({ status: 'accepted', value: 'latest' })
  })

  it('marks an older successful task as stale', async () => {
    const runner = createLatestAsyncTaskRunner()
    const first = createDeferred<string>()
    const second = createDeferred<string>()
    const firstRun = runner.run(() => first.promise)
    const secondRun = runner.run(() => second.promise)

    first.resolve('old')
    second.resolve('new')

    await expect(firstRun).resolves.toEqual({ status: 'stale' })
    await expect(secondRun).resolves.toEqual({ status: 'accepted', value: 'new' })
  })

  it('suppresses stale failures while preserving the latest failure', async () => {
    const runner = createLatestAsyncTaskRunner()
    const first = createDeferred<string>()
    const firstRun = runner.run(() => first.promise)
    const secondRun = runner.run(async () => {
      throw new Error('latest failure')
    })

    first.reject(new Error('stale failure'))

    await expect(firstRun).resolves.toEqual({ status: 'stale' })
    await expect(secondRun).rejects.toThrow('latest failure')
  })

  it('marks work as stale after explicit invalidation', async () => {
    const runner = createLatestAsyncTaskRunner()
    const deferred = createDeferred<string>()
    const run = runner.run(() => deferred.promise)

    runner.invalidate()
    deferred.resolve('ignored')

    await expect(run).resolves.toEqual({ status: 'stale' })
  })
})
