import { describe, expect, it, vi } from 'vitest'
import { createCompleteProjectSyncRunner } from '@/features/editor/completeProjectSyncState'

const createDeferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('completeProjectSyncState', () => {
  it('allows only the latest project flow to reach later phases', async () => {
    const firstDraft = createDeferred()
    const secondDraft = createDeferred()
    const calls: string[] = []
    const runner = createCompleteProjectSyncRunner({
      loadDraft: vi.fn((projectId) => {
        calls.push(`draft:${projectId}`)
        return projectId === 'project-1' ? firstDraft.promise : secondDraft.promise
      }),
      ensureProjectsLoaded: vi.fn(async () => calls.push('projects')),
      markProjectComplete: vi.fn(async (projectId) => calls.push(`complete:${projectId}`)),
      refreshExportWorkspace: vi.fn(async (projectId) => calls.push(`export:${projectId}`)),
    })

    const firstRun = runner.run('project-1')
    const secondRun = runner.run('project-2')
    secondDraft.resolve()
    await expect(secondRun).resolves.toBe(true)
    firstDraft.resolve()
    await expect(firstRun).resolves.toBe(false)

    expect(calls).toEqual(['draft:project-1', 'draft:project-2', 'projects', 'complete:project-2', 'export:project-2'])
  })

  it('stops a flow after explicit invalidation', async () => {
    const draft = createDeferred()
    const ensureProjectsLoaded = vi.fn(async () => undefined)
    const runner = createCompleteProjectSyncRunner({
      loadDraft: vi.fn(() => draft.promise),
      ensureProjectsLoaded,
      markProjectComplete: vi.fn(async () => undefined),
      refreshExportWorkspace: vi.fn(async () => undefined),
    })

    const run = runner.run('project-1')
    runner.invalidate()
    draft.resolve()

    await expect(run).resolves.toBe(false)
    expect(ensureProjectsLoaded).not.toHaveBeenCalled()
  })

  it('suppresses failures from stale flows', async () => {
    const firstDraft = createDeferred()
    const runner = createCompleteProjectSyncRunner({
      loadDraft: vi.fn((projectId) => (projectId === 'project-1' ? firstDraft.promise : Promise.resolve())),
      ensureProjectsLoaded: vi.fn(async () => undefined),
      markProjectComplete: vi.fn(async () => undefined),
      refreshExportWorkspace: vi.fn(async () => undefined),
    })

    const staleRun = runner.run('project-1')
    await expect(runner.run('project-2')).resolves.toBe(true)
    firstDraft.reject(new Error('stale failure'))

    await expect(staleRun).resolves.toBe(false)
  })

  it('propagates failures from the latest flow', async () => {
    const runner = createCompleteProjectSyncRunner({
      loadDraft: vi.fn(async () => {
        throw new Error('latest failure')
      }),
      ensureProjectsLoaded: vi.fn(async () => undefined),
      markProjectComplete: vi.fn(async () => undefined),
      refreshExportWorkspace: vi.fn(async () => undefined),
    })

    await expect(runner.run('project-1')).rejects.toThrow('latest failure')
  })
})
