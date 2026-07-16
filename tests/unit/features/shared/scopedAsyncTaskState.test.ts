import { describe, expect, it } from 'vitest'
import { createScopedAsyncTaskRunner } from '@/features/shared/scopedAsyncTaskState'

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('scopedAsyncTaskState', () => {
  it('accepts multiple concurrent tasks in the same scope', async () => {
    const runner = createScopedAsyncTaskRunner()
    const first = createDeferred<string>()
    const second = createDeferred<string>()

    const firstRun = runner.run(() => first.promise)
    const secondRun = runner.run(() => second.promise)
    second.resolve('second')
    first.resolve('first')

    await expect(firstRun).resolves.toEqual({ status: 'accepted', value: 'first' })
    await expect(secondRun).resolves.toEqual({ status: 'accepted', value: 'second' })
  })

  it('marks pending successes as stale after invalidation', async () => {
    const runner = createScopedAsyncTaskRunner()
    const task = createDeferred<string>()
    const run = runner.run(() => task.promise)

    runner.invalidate()
    task.resolve('old result')

    await expect(run).resolves.toEqual({ status: 'stale' })
  })

  it('suppresses pending failures after invalidation', async () => {
    const runner = createScopedAsyncTaskRunner()
    const task = createDeferred<string>()
    const run = runner.run(() => task.promise)

    runner.invalidate()
    task.reject(new Error('old failure'))

    await expect(run).resolves.toEqual({ status: 'stale' })
  })

  it('propagates failures from the current scope', async () => {
    const runner = createScopedAsyncTaskRunner()

    await expect(
      runner.run(async () => {
        throw new Error('current failure')
      }),
    ).rejects.toThrow('current failure')
  })
})
