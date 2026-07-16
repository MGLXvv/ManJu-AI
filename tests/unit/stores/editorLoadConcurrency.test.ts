import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { createDefaultEditorDraft } from '@/features/editor/editorDraftDefaults'
import { useEditorStore } from '@/stores/editor'
import type { EditorDraft } from '@/types/editor'

const { getDraft } = vi.hoisted(() => ({ getDraft: vi.fn() }))

vi.mock('@/api/editor.api', () => ({
  editorApi: {
    getDraft,
  },
}))

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const createDraft = (projectId: string, content: string): EditorDraft => {
  const draft = createDefaultEditorDraft(projectId)
  return {
    ...draft,
    script: {
      ...draft.script,
      content,
    },
  }
}

describe('editor store load concurrency', () => {
  beforeEach(() => {
    getDraft.mockReset()
    resetLocalState()
    setActivePinia(createPinia())
  })

  it('commits only the latest project when project loads overlap', async () => {
    const first = createDeferred<EditorDraft>()
    const second = createDeferred<EditorDraft>()
    getDraft.mockImplementation((projectId: string) => (projectId === 'project-a' ? first.promise : second.promise))
    const store = useEditorStore()

    const firstLoad = store.loadDraft('project-a')
    await vi.waitFor(() => expect(getDraft).toHaveBeenCalledWith('project-a'))
    const secondLoad = store.loadDraft('project-b')
    expect(store.currentProjectId).toBe('project-b')
    expect(store.loading).toBe(true)

    first.resolve(createDraft('project-a', 'stale project'))
    await vi.waitFor(() => expect(getDraft).toHaveBeenCalledWith('project-b'))
    expect(store.draft?.projectId).not.toBe('project-a')

    second.resolve(createDraft('project-b', 'latest project'))
    await Promise.all([firstLoad, secondLoad])

    expect(store.currentProjectId).toBe('project-b')
    expect(store.draft?.projectId).toBe('project-b')
    expect(store.draft?.script.content).toBe('latest project')
    expect(store.loading).toBe(false)
  })

  it('continues with the latest project when a stale load fails', async () => {
    const first = createDeferred<EditorDraft>()
    const second = createDeferred<EditorDraft>()
    getDraft.mockImplementation((projectId: string) => (projectId === 'project-a' ? first.promise : second.promise))
    const store = useEditorStore()

    const firstLoad = store.loadDraft('project-a')
    await vi.waitFor(() => expect(getDraft).toHaveBeenCalledWith('project-a'))
    const secondLoad = store.loadDraft('project-b')

    first.reject(new Error('stale project failed'))
    await vi.waitFor(() => expect(getDraft).toHaveBeenCalledWith('project-b'))
    second.resolve(createDraft('project-b', 'recovered latest project'))

    await expect(firstLoad).resolves.toBeUndefined()
    await expect(secondLoad).resolves.toBeUndefined()
    expect(store.draft?.projectId).toBe('project-b')
    expect(store.draft?.script.content).toBe('recovered latest project')
  })
  it('coalesces duplicate same-project loads into one API request', async () => {
    const deferred = createDeferred<EditorDraft>()
    getDraft.mockReturnValue(deferred.promise)
    const store = useEditorStore()

    const firstLoad = store.loadDraft('project-shared')
    const secondLoad = store.loadDraft('project-shared')

    await Promise.resolve()
    expect(getDraft).toHaveBeenCalledTimes(1)
    deferred.resolve(createDraft('project-shared', 'shared result'))
    await Promise.all([firstLoad, secondLoad])

    expect(store.draft?.script.content).toBe('shared result')
  })
})
