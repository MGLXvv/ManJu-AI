import { describe, expect, it, vi } from 'vitest'
import { createScriptConfirmationRunner } from '@/features/editor/scriptConfirmationState'

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('scriptConfirmationState', () => {
  it('advances only the captured project after confirmation', async () => {
    const advanceProject = vi.fn(async () => undefined)
    const runner = createScriptConfirmationRunner({
      confirmScript: vi.fn(async () => undefined),
      advanceProject,
    })

    await expect(runner.run('project-1')).resolves.toBe(true)
    expect(advanceProject).toHaveBeenCalledWith('project-1')
  })

  it('stops before advancing after invalidation', async () => {
    const confirmation = createDeferred()
    const advanceProject = vi.fn(async () => undefined)
    const runner = createScriptConfirmationRunner({
      confirmScript: vi.fn(() => confirmation.promise),
      advanceProject,
    })

    const run = runner.run('project-1')
    runner.invalidate()
    confirmation.resolve()

    await expect(run).resolves.toBe(false)
    expect(advanceProject).not.toHaveBeenCalled()
  })

  it('suppresses failures from stale confirmations', async () => {
    const confirmation = createDeferred()
    const runner = createScriptConfirmationRunner({
      confirmScript: vi.fn(() => confirmation.promise),
      advanceProject: vi.fn(async () => undefined),
    })

    const run = runner.run('project-1')
    runner.invalidate()
    confirmation.reject(new Error('stale failure'))

    await expect(run).resolves.toBe(false)
  })

  it('propagates failures from the current confirmation', async () => {
    const runner = createScriptConfirmationRunner({
      confirmScript: vi.fn(async () => {
        throw new Error('current failure')
      }),
      advanceProject: vi.fn(async () => undefined),
    })

    await expect(runner.run('project-1')).rejects.toThrow('current failure')
  })
})
