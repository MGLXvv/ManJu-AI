import { describe, expect, it, vi } from 'vitest'
import { createProjectPhaseRunner, isProjectRouteContextCurrent } from '@/features/shared/projectPhaseRunnerState'

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('projectPhaseRunnerState', () => {
  it('passes the captured project to every phase', async () => {
    const calls: string[] = []
    const runner = createProjectPhaseRunner()

    await expect(
      runner.run('project-1', [
        vi.fn(async (projectId) => calls.push('confirm:' + projectId)),
        vi.fn(async (projectId) => calls.push('advance:' + projectId)),
      ]),
    ).resolves.toBe(true)
    expect(calls).toEqual(['confirm:project-1', 'advance:project-1'])
  })

  it('stops before later phases after invalidation', async () => {
    const firstPhase = createDeferred()
    const laterPhase = vi.fn(async () => undefined)
    const runner = createProjectPhaseRunner()
    const run = runner.run('project-1', [vi.fn(() => firstPhase.promise), laterPhase])

    runner.invalidate()
    firstPhase.resolve()

    await expect(run).resolves.toBe(false)
    expect(laterPhase).not.toHaveBeenCalled()
  })

  it('suppresses stale failures and propagates current failures', async () => {
    const stalePhase = createDeferred()
    const runner = createProjectPhaseRunner()
    const staleRun = runner.run('project-1', [vi.fn(() => stalePhase.promise)])

    runner.invalidate()
    stalePhase.reject(new Error('stale failure'))

    await expect(staleRun).resolves.toBe(false)
    await expect(
      runner.run('project-2', [
        vi.fn(async () => {
          throw new Error('current failure')
        }),
      ]),
    ).rejects.toThrow('current failure')
  })

  it('accepts only matching project and route context', () => {
    expect(
      isProjectRouteContextCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetRouteName: 'editor-settings',
        currentRouteName: 'editor-settings',
      }),
    ).toBe(true)
    expect(
      isProjectRouteContextCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-2',
        targetRouteName: 'editor-settings',
        currentRouteName: 'editor-settings',
      }),
    ).toBe(false)
    expect(
      isProjectRouteContextCurrent({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetRouteName: 'editor-settings',
        currentRouteName: 'editor-storyboard',
      }),
    ).toBe(false)
  })
})
