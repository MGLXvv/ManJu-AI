import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { createDefaultEditorDraft } from '@/features/editor/editorDraftDefaults'
import { useEditorStore } from '@/stores/editor'
import type { EditorDraft, SaveDraftResult } from '@/types/editor'

const { getDraft, saveDraft } = vi.hoisted(() => ({
  getDraft: vi.fn(),
  saveDraft: vi.fn(),
}))

vi.mock('@/api/editor.api', () => ({
  editorApi: {
    getDraft,
    saveDraft,
  },
}))

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const createDraft = (projectId: string, content: string): EditorDraft => {
  const draft = createDefaultEditorDraft(projectId)
  draft.script.content = content
  return draft
}

describe('editor store save concurrency', () => {
  beforeEach(() => {
    getDraft.mockReset()
    saveDraft.mockReset()
    resetLocalState()
    setActivePinia(createPinia())
  })

  it('does not apply an old project save result to the newly active draft', async () => {
    const savedAt = '2026-07-16T12:00:00.000Z'
    const deferred = createDeferred<SaveDraftResult>()
    getDraft.mockImplementation((projectId: string) => Promise.resolve(createDraft(projectId, `${projectId} content`)))
    saveDraft.mockReturnValueOnce(deferred.promise)
    const store = useEditorStore()

    await store.loadDraft('project-a')
    store.updateScriptContent('project-a changed')
    const savePromise = store.saveDraft()
    await vi.waitFor(() => expect(saveDraft).toHaveBeenCalledWith('project-a', expect.any(Object), expect.any(Object)))

    await store.loadDraft('project-b')
    const projectBUpdatedAt = store.draft?.script.updatedAt

    deferred.resolve({
      draft: { ...createDraft('project-a', 'saved project-a'), revision: 7 },
      revision: 7,
      savedAt,
    })
    await savePromise

    expect(store.currentProjectId).toBe('project-b')
    expect(store.draft?.projectId).toBe('project-b')
    expect(store.draft?.revision).toBe(0)
    expect(store.draft?.script.updatedAt).toBe(projectBUpdatedAt)
  })
})
