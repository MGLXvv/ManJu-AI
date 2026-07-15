import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/api/errors'
import { resetLocalState } from '@/api/local'
import type { EditorApiContract } from '@/api/modules/editor/editor.types'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { EditorPersistenceService, resolveEditorDirtyPartitions } from '@/services/editor/editorPersistence.service'
import { API_ERROR_CODES, EDITOR_SAVE_STATES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS, type EditorDraft } from '@/types/editor'

const createApiMock = () => {
  const getDraft = vi.fn()
  const saveDraft = vi.fn()
  const api: EditorApiContract = {
    getDraft,
    saveDraft,
  }

  return { api, getDraft, saveDraft }
}

const createShot = () => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  description: '角色走入房间',
  characterIds: [],
  sceneIds: [],
  propIds: [],
  videoUrl: '',
  videoPrompt: '',
  dialogue: '',
  durationSeconds: 10,
  voiceAssignments: [],
  status: 'pending-review' as const,
  storyboardReviewed: false,
  videoReviewed: false,
})

const buildSavedResult = (draft: EditorDraft, revision: number) => ({
  draft: {
    ...draft,
    revision,
  },
  revision,
  savedAt: `2026-07-11T12:00:0${revision}.000Z`,
})

describe('EditorPersistenceService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetLocalState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('separates script, storyboard, video, dubbing, setting and project metadata changes', () => {
    const baseline = createDefaultEditorDraft('project-partitions')
    baseline.shots = [createShot()]

    const current = createDefaultEditorDraft('project-partitions')
    current.shots = [
      {
        ...createShot(),
        title: '镜头 1A',
        videoPrompt: '镜头向前推进',
      },
    ]
    current.script.content = '新的文案'
    current.storyboardGenerationMode = 'image'
    current.dubbing.modelId = 'azure-tts'
    current.settingAssets = [
      {
        id: 'asset-1',
        type: 'scene',
        title: '房间',
        description: '夜晚房间',
        prompt: '夜晚房间',
        imageUrls: [],
        status: 'empty',
        favorite: false,
        createdAt: '2026-07-11T12:00:00.000Z',
      },
    ]

    expect(resolveEditorDirtyPartitions(baseline, current)).toEqual([
      EDITOR_PERSISTENCE_PARTITIONS.script,
      EDITOR_PERSISTENCE_PARTITIONS.setting,
      EDITOR_PERSISTENCE_PARTITIONS.storyboard,
      EDITOR_PERSISTENCE_PARTITIONS.video,
      EDITOR_PERSISTENCE_PARTITIONS.dubbing,
      EDITOR_PERSISTENCE_PARTITIONS.projectMeta,
    ])
  })

  it('debounces autosave and advances the revision', async () => {
    const { api, getDraft, saveDraft } = createApiMock()
    const baseline = createDefaultEditorDraft('project-autosave')
    getDraft.mockResolvedValue(baseline)
    saveDraft.mockImplementation(async (_projectId: string, draft: EditorDraft) => buildSavedResult(draft, 1))

    const service = new EditorPersistenceService(api, 50)
    const loaded = await service.load('project-autosave')
    loaded.script.content = '第一次修改'
    service.track('project-autosave', loaded)
    loaded.script.content = '第二次修改'
    service.track('project-autosave', loaded)

    expect(service.getState('project-autosave')).toMatchObject({
      status: EDITOR_SAVE_STATES.dirty,
      dirtyPartitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(saveDraft).toHaveBeenCalledTimes(1)
    expect(saveDraft).toHaveBeenCalledWith(
      'project-autosave',
      expect.objectContaining({
        script: expect.objectContaining({ content: '第二次修改' }),
      }),
      expect.objectContaining({
        expectedRevision: 0,
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
        reason: 'autosave',
      }),
    )
    expect(service.getState('project-autosave')).toMatchObject({
      status: EDITOR_SAVE_STATES.saved,
      revision: 1,
      dirtyPartitions: [],
    })
  })

  it('surfaces revision conflicts and can overwrite against the latest remote revision', async () => {
    const { api, getDraft, saveDraft } = createApiMock()
    const baseline = createDefaultEditorDraft('project-conflict')
    getDraft.mockResolvedValueOnce(baseline)
    saveDraft.mockRejectedValueOnce(
      createApiError({
        message: 'conflict',
        code: API_ERROR_CODES.editorSaveConflict,
        status: 409,
      }),
    )

    const service = new EditorPersistenceService(api, 50)
    const loaded = await service.load('project-conflict')
    loaded.script.content = '本地修改'
    service.track('project-conflict', loaded)

    await expect(service.flush('project-conflict')).rejects.toHaveProperty('code', API_ERROR_CODES.editorSaveConflict)
    expect(service.getState('project-conflict')).toMatchObject({
      status: EDITOR_SAVE_STATES.conflict,
      errorCode: API_ERROR_CODES.editorSaveConflict,
    })

    const remote = createDefaultEditorDraft('project-conflict')
    remote.revision = 2
    remote.script.content = '远端修改'
    getDraft.mockResolvedValueOnce(remote)
    saveDraft.mockImplementationOnce(async (_projectId: string, draft: EditorDraft) => buildSavedResult(draft, 3))

    await service.overwriteConflict('project-conflict')

    expect(saveDraft).toHaveBeenLastCalledWith(
      'project-conflict',
      expect.objectContaining({
        script: expect.objectContaining({ content: '本地修改' }),
      }),
      expect.objectContaining({
        expectedRevision: 2,
        reason: 'conflict-overwrite',
      }),
    )
    expect(service.getState('project-conflict')).toMatchObject({
      status: EDITOR_SAVE_STATES.saved,
      revision: 3,
    })
  })

  it('keeps failed changes pending and supports an explicit retry', async () => {
    const { api, getDraft, saveDraft } = createApiMock()
    const baseline = createDefaultEditorDraft('project-retry')
    getDraft.mockResolvedValue(baseline)
    saveDraft
      .mockRejectedValueOnce(
        createApiError({
          message: 'failed',
          code: API_ERROR_CODES.editorSaveFailed,
          status: 422,
        }),
      )
      .mockImplementationOnce(async (_projectId: string, draft: EditorDraft) => buildSavedResult(draft, 1))

    const service = new EditorPersistenceService(api, 50)
    const loaded = await service.load('project-retry')
    loaded.script.prompt = '新的提示词'
    service.track('project-retry', loaded)

    await expect(service.flush('project-retry')).rejects.toHaveProperty('code', API_ERROR_CODES.editorSaveFailed)
    expect(service.hasUnsavedChanges('project-retry')).toBe(true)
    expect(service.getState('project-retry')?.status).toBe(EDITOR_SAVE_STATES.error)

    await service.retry('project-retry')

    expect(saveDraft).toHaveBeenCalledTimes(2)
    expect(service.hasUnsavedChanges('project-retry')).toBe(false)
    expect(service.getState('project-retry')?.status).toBe(EDITOR_SAVE_STATES.saved)
  })

  it('restores a locally saved script when the API is unavailable', async () => {
    const projectId = 'project-offline-recovery'
    const { api, getDraft, saveDraft } = createApiMock()
    const baseline = createDefaultEditorDraft(projectId)
    getDraft.mockResolvedValueOnce(baseline)
    saveDraft.mockRejectedValueOnce(new Error('offline save'))

    const service = new EditorPersistenceService(api, 50)
    const loaded = await service.load(projectId)
    loaded.script.content = 'local recovery content'
    service.track(projectId, loaded)

    expect(service.getState(projectId)).toMatchObject({
      localSaveStatus: 'saved',
      recoveredFromLocal: false,
    })
    await expect(service.flush(projectId)).rejects.toThrow('offline save')

    const offline = createApiMock()
    offline.getDraft.mockRejectedValueOnce(new Error('offline load'))
    const restoredService = new EditorPersistenceService(offline.api, 50)
    const restored = await restoredService.load(projectId)

    expect(restored.script.content).toBe('local recovery content')
    expect(restoredService.getState(projectId)).toMatchObject({
      status: EDITOR_SAVE_STATES.error,
      localSaveStatus: 'saved',
      recoveredFromLocal: true,
      dirtyPartitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
    })
  })

  it('prefers a newer remote revision over stale local recovery', async () => {
    const projectId = 'project-stale-recovery'
    const initial = createApiMock()
    const baseline = createDefaultEditorDraft(projectId)
    initial.getDraft.mockResolvedValueOnce(baseline)

    const service = new EditorPersistenceService(initial.api, 50)
    const loaded = await service.load(projectId)
    loaded.script.content = 'stale local content'
    service.track(projectId, loaded)

    const remote = createDefaultEditorDraft(projectId)
    remote.revision = 1
    remote.script.content = 'newer remote content'
    const refreshed = createApiMock()
    refreshed.getDraft.mockResolvedValueOnce(remote)
    const refreshedService = new EditorPersistenceService(refreshed.api, 50)
    const result = await refreshedService.load(projectId)

    expect(result.script.content).toBe('newer remote content')
    expect(refreshedService.getState(projectId)).toMatchObject({
      localSaveStatus: 'idle',
      recoveredFromLocal: false,
      dirtyPartitions: [],
    })
  })
})
