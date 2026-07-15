import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetLocalState } from '@/api/local'
import { useEditorStore } from '@/stores/editor'
import { EDITOR_SAVE_STATES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS } from '@/types/editor'

describe('editor store persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetLocalState()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('autosaves dirty script changes and restores them after recreating the store', async () => {
    const projectId = 'project-editor-autosave'
    const store = useEditorStore()
    const loadPromise = store.loadDraft(projectId)
    await vi.advanceTimersByTimeAsync(120)
    await loadPromise

    store.updateScriptContent('刷新后仍需保留的文案')

    expect(store.hasUnsavedChanges).toBe(true)
    expect(store.saveState).toBe(EDITOR_SAVE_STATES.dirty)
    expect(store.dirtyPartitions).toEqual([EDITOR_PERSISTENCE_PARTITIONS.script])

    await vi.advanceTimersByTimeAsync(880)

    expect(store.saveState).toBe(EDITOR_SAVE_STATES.saved)
    expect(store.hasUnsavedChanges).toBe(false)
    expect(store.revision).toBe(1)

    setActivePinia(createPinia())
    const restoredStore = useEditorStore()
    const restorePromise = restoredStore.loadDraft(projectId)
    await vi.advanceTimersByTimeAsync(120)
    await restorePromise

    expect(restoredStore.draft?.script.content).toBe('刷新后仍需保留的文案')
    expect(restoredStore.revision).toBe(1)
  })

  it('retains failed changes for retry instead of marking them saved', async () => {
    const projectId = 'project-editor-save-failure'
    const store = useEditorStore()
    const loadPromise = store.loadDraft(projectId)
    await vi.advanceTimersByTimeAsync(120)
    await loadPromise

    store.updateScriptContent('#mock-save-fail')
    await vi.advanceTimersByTimeAsync(880)

    expect(store.saveState).toBe(EDITOR_SAVE_STATES.error)
    expect(store.hasUnsavedChanges).toBe(true)
    expect(store.saveErrorCode).toBe('EDITOR_SAVE_FAILED')

    store.updateScriptContent('修复后的内容')
    const retryPromise = store.retrySave()
    await vi.advanceTimersByTimeAsync(80)
    await retryPromise

    expect(store.saveState).toBe(EDITOR_SAVE_STATES.saved)
    expect(store.hasUnsavedChanges).toBe(false)
    expect(store.draft?.script.content).toBe('修复后的内容')
  })

  it('recovers locally saved script changes after recreating the store', async () => {
    const projectId = 'project-editor-local-recovery'
    const store = useEditorStore()
    const loadPromise = store.loadDraft(projectId)
    await vi.advanceTimersByTimeAsync(120)
    await loadPromise

    store.updateScriptContent('#mock-save-fail recovery')
    await vi.advanceTimersByTimeAsync(880)

    expect(store.saveState).toBe(EDITOR_SAVE_STATES.error)
    expect(store.localSaveStatus).toBe('saved')
    expect(store.recoveredFromLocal).toBe(false)

    setActivePinia(createPinia())
    const restoredStore = useEditorStore()
    const restorePromise = restoredStore.loadDraft(projectId)
    await vi.advanceTimersByTimeAsync(120)
    await restorePromise

    expect(restoredStore.draft?.script.content).toBe('#mock-save-fail recovery')
    expect(restoredStore.hasUnsavedChanges).toBe(true)
    expect(restoredStore.localSaveStatus).toBe('saved')
    expect(restoredStore.recoveredFromLocal).toBe(true)
  })
})
