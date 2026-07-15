import { isApiError } from '@/api/errors'
import { editorApi } from '@/api/editor.api'
import type { EditorApiContract } from '@/api/modules/editor/editor.types'
import { createDefaultEditorDraft } from '@/features/editor/editorDraftDefaults'
import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import {
  editorScriptRecoveryRepository,
  type EditorScriptRecoveryRecord,
  type EditorScriptRecoveryStore,
} from '@/services/editor/editorScriptRecoveryRepository'
import { API_ERROR_CODES, EDITOR_SAVE_STATES, type EditorSaveState } from '@/types/api-enums'
import {
  EDITOR_PERSISTENCE_PARTITIONS,
  type EditorDraft,
  type EditorPersistencePartition,
  type EditorSaveReason,
  type SaveDraftResult,
} from '@/types/editor'

export const DEFAULT_EDITOR_AUTOSAVE_DELAY_MS = 800

export interface EditorPersistenceState {
  projectId: string
  status: EditorSaveState
  revision: number
  lastSavedAt: string | null
  dirtyPartitions: EditorPersistencePartition[]
  errorCode: string | null
  localSaveStatus: 'idle' | 'saved' | 'error'
  localSavedAt: string | null
  localErrorCode: string | null
  recoveredFromLocal: boolean
}

export type EditorPersistenceListener = (state: EditorPersistenceState) => void

interface EditorPersistenceRecord {
  baseline: EditorDraft
  pendingDraft: EditorDraft | null
  pendingVersion: number
  timer: ReturnType<typeof globalThis.setTimeout> | null
  inFlight: Promise<SaveDraftResult> | null
  state: EditorPersistenceState
}

const ALL_PARTITIONS = Object.values(EDITOR_PERSISTENCE_PARTITIONS)

const cloneDraft = (draft: EditorDraft): EditorDraft => normalizeEditorDraft(draft.projectId, draft)

const stableSerialize = (value: unknown): string => JSON.stringify(value)

const buildRecoverableScriptSnapshot = (draft: EditorDraft) => ({
  content: draft.script.content,
  prompt: draft.script.prompt,
  outline: draft.script.outline,
  generated: draft.script.generated,
  storyboard: draft.script.storyboard,
})

const buildStoryboardPartition = (draft: EditorDraft) =>
  draft.shots.map((shot) => ({
    id: shot.id,
    index: shot.index,
    title: shot.title,
    description: shot.description,
    characterIds: shot.characterIds,
    sceneIds: shot.sceneIds,
    propIds: shot.propIds,
    imageUrl: shot.imageUrl,
    status: shot.status,
    style: shot.style,
    ratio: shot.ratio,
    isHidden: shot.isHidden,
    isLocked: shot.isLocked,
    storyboardReviewed: shot.storyboardReviewed,
    referenceImages: shot.referenceImages,
    editHistory: shot.editHistory,
    createdAt: shot.createdAt,
  }))

const buildVideoPartition = (draft: EditorDraft) =>
  draft.shots.map((shot) => ({
    id: shot.id,
    videoUrl: shot.videoUrl,
    videoPrompt: shot.videoPrompt,
    dialogue: shot.dialogue,
    durationSeconds: shot.durationSeconds,
    voiceAssignments: shot.voiceAssignments,
    videoReviewed: shot.videoReviewed,
  }))

export const buildEditorPartitionSnapshot = (draft: EditorDraft, partition: EditorPersistencePartition): unknown => {
  switch (partition) {
    case EDITOR_PERSISTENCE_PARTITIONS.script:
      return draft.script
    case EDITOR_PERSISTENCE_PARTITIONS.setting:
      return {
        settingAssets: draft.settingAssets,
        characters: draft.characters,
        scenes: draft.scenes,
        props: draft.props,
      }
    case EDITOR_PERSISTENCE_PARTITIONS.storyboard:
      return buildStoryboardPartition(draft)
    case EDITOR_PERSISTENCE_PARTITIONS.video:
      return buildVideoPartition(draft)
    case EDITOR_PERSISTENCE_PARTITIONS.dubbing:
      return draft.dubbing
    case EDITOR_PERSISTENCE_PARTITIONS.projectMeta:
      return {
        projectId: draft.projectId,
        storyboardGenerationMode: draft.storyboardGenerationMode,
      }
  }
}

export const resolveEditorDirtyPartitions = (
  baseline: EditorDraft,
  current: EditorDraft,
): EditorPersistencePartition[] =>
  ALL_PARTITIONS.filter(
    (partition) =>
      stableSerialize(buildEditorPartitionSnapshot(baseline, partition)) !==
      stableSerialize(buildEditorPartitionSnapshot(current, partition)),
  )

const resolveErrorCode = (error: unknown): string => {
  if (isApiError(error)) {
    return error.code
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return API_ERROR_CODES.editorSaveFailed
}

export class EditorPersistenceService {
  private readonly records = new Map<string, EditorPersistenceRecord>()
  private readonly listeners = new Set<EditorPersistenceListener>()

  constructor(
    private readonly api: EditorApiContract = editorApi,
    private readonly autosaveDelayMs = DEFAULT_EDITOR_AUTOSAVE_DELAY_MS,
    private readonly recoveryStore: EditorScriptRecoveryStore = editorScriptRecoveryRepository,
  ) {}

  subscribe(listener: EditorPersistenceListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(record: EditorPersistenceRecord): void {
    const state = this.copyState(record.state)
    for (const listener of this.listeners) {
      listener(state)
    }
  }

  private copyState(state: EditorPersistenceState): EditorPersistenceState {
    return {
      ...state,
      dirtyPartitions: [...state.dirtyPartitions],
    }
  }

  private clearTimer(record: EditorPersistenceRecord): void {
    if (record.timer !== null) {
      globalThis.clearTimeout(record.timer)
      record.timer = null
    }
  }

  register(projectId: string, draft: EditorDraft, lastSavedAt: string | null = null): EditorDraft {
    const existing = this.records.get(projectId)
    if (existing) {
      this.clearTimer(existing)
    }

    const baseline = cloneDraft(draft)
    const record: EditorPersistenceRecord = {
      baseline,
      pendingDraft: null,
      pendingVersion: 0,
      timer: null,
      inFlight: null,
      state: {
        projectId,
        status: EDITOR_SAVE_STATES.idle,
        revision: baseline.revision ?? 0,
        lastSavedAt,
        dirtyPartitions: [],
        errorCode: null,
        localSaveStatus: 'idle',
        localSavedAt: null,
        localErrorCode: null,
        recoveredFromLocal: false,
      },
    }

    this.records.set(projectId, record)
    this.emit(record)
    return cloneDraft(baseline)
  }

  private applyRecovery(
    projectId: string,
    baseline: EditorDraft,
    recovery: EditorScriptRecoveryRecord,
    loadErrorCode: string | null = null,
  ): EditorDraft {
    const record = this.records.get(projectId)
    if (!record) {
      return cloneDraft(baseline)
    }

    const baselineMatches =
      (baseline.revision ?? 0) === recovery.baseRevision &&
      stableSerialize(buildRecoverableScriptSnapshot(baseline)) ===
        stableSerialize({
          content: recovery.baseline.content,
          prompt: recovery.baseline.prompt,
          outline: recovery.baseline.outline,
          generated: recovery.baseline.generated,
          storyboard: recovery.baseline.storyboard,
        })

    if (!baselineMatches) {
      this.recoveryStore.remove(projectId)
      return cloneDraft(baseline)
    }

    const recoveredDraft = normalizeEditorDraft(projectId, {
      ...baseline,
      revision: recovery.baseRevision,
      script: recovery.draft,
    })
    const dirtyPartitions = resolveEditorDirtyPartitions(record.baseline, recoveredDraft)
    if (!dirtyPartitions.includes(EDITOR_PERSISTENCE_PARTITIONS.script)) {
      this.recoveryStore.remove(projectId)
      return cloneDraft(baseline)
    }

    record.pendingDraft = cloneDraft(recoveredDraft)
    record.pendingVersion += 1
    record.state = {
      ...record.state,
      status: loadErrorCode ? EDITOR_SAVE_STATES.error : EDITOR_SAVE_STATES.dirty,
      dirtyPartitions,
      errorCode: loadErrorCode,
      localSaveStatus: 'saved',
      localSavedAt: recovery.savedLocallyAt,
      localErrorCode: null,
      recoveredFromLocal: true,
    }
    this.emit(record)
    return cloneDraft(recoveredDraft)
  }

  private persistScriptRecovery(
    record: EditorPersistenceRecord,
    draft: EditorDraft,
    dirtyPartitions: EditorPersistencePartition[],
  ): void {
    if (!dirtyPartitions.includes(EDITOR_PERSISTENCE_PARTITIONS.script)) {
      this.recoveryStore.remove(record.state.projectId)
      record.state.localSaveStatus = 'idle'
      record.state.localSavedAt = null
      record.state.localErrorCode = null
      record.state.recoveredFromLocal = false
      return
    }

    try {
      const recovery = this.recoveryStore.write({
        projectId: record.state.projectId,
        baseRevision: record.baseline.revision ?? 0,
        baseline: record.baseline.script,
        draft: draft.script,
      })
      record.state.localSaveStatus = 'saved'
      record.state.localSavedAt = recovery.savedLocallyAt
      record.state.localErrorCode = null
    } catch (error) {
      record.state.localSaveStatus = 'error'
      record.state.localErrorCode = resolveErrorCode(error)
    }
  }

  async load(projectId: string): Promise<EditorDraft> {
    const recovery = this.recoveryStore.read(projectId)
    try {
      const draft = await this.api.getDraft(projectId)
      const baseline = this.register(projectId, draft, draft.script.updatedAt || null)
      return recovery ? this.applyRecovery(projectId, baseline, recovery) : baseline
    } catch (error) {
      if (!recovery) {
        throw error
      }

      const baseline = createDefaultEditorDraft(projectId)
      baseline.revision = recovery.baseRevision
      baseline.script = recovery.baseline
      this.register(projectId, baseline, baseline.script.updatedAt || null)
      return this.applyRecovery(projectId, baseline, recovery, resolveErrorCode(error))
    }
  }

  getState(projectId: string): EditorPersistenceState | null {
    const record = this.records.get(projectId)
    return record ? this.copyState(record.state) : null
  }

  hasUnsavedChanges(projectId: string, draft?: EditorDraft): boolean {
    const record = this.records.get(projectId)
    if (!record) {
      return false
    }

    const candidate = draft ? cloneDraft(draft) : record.pendingDraft
    return Boolean(candidate && resolveEditorDirtyPartitions(record.baseline, candidate).length > 0)
  }

  track(projectId: string, draft: EditorDraft): EditorPersistencePartition[] {
    const record = this.records.get(projectId)
    if (!record) {
      this.register(projectId, draft)
      return []
    }

    record.pendingDraft = cloneDraft(draft)
    record.pendingVersion += 1
    const dirtyPartitions = resolveEditorDirtyPartitions(record.baseline, record.pendingDraft)
    record.state = {
      ...record.state,
      status: dirtyPartitions.length > 0 ? EDITOR_SAVE_STATES.dirty : EDITOR_SAVE_STATES.saved,
      dirtyPartitions,
      errorCode: null,
    }
    this.persistScriptRecovery(record, record.pendingDraft, dirtyPartitions)
    this.emit(record)
    this.clearTimer(record)

    if (dirtyPartitions.length > 0) {
      record.timer = globalThis.setTimeout(() => {
        record.timer = null
        void this.flush(projectId, undefined, 'autosave').catch(() => undefined)
      }, this.autosaveDelayMs)
    }

    return [...dirtyPartitions]
  }

  async flush(
    projectId: string,
    draft?: EditorDraft,
    reason: EditorSaveReason = 'manual',
  ): Promise<SaveDraftResult | null> {
    const record = this.records.get(projectId)
    if (!record) {
      throw new Error(API_ERROR_CODES.editorDraftNotLoaded)
    }

    if (draft) {
      record.pendingDraft = cloneDraft(draft)
      record.pendingVersion += 1
    }

    this.clearTimer(record)

    if (record.inFlight) {
      try {
        await record.inFlight
      } catch {
        // The current caller explicitly requested another attempt.
      }
    }

    const candidate = record.pendingDraft
    if (!candidate) {
      return null
    }

    const dirtyPartitions = resolveEditorDirtyPartitions(record.baseline, candidate)
    if (dirtyPartitions.length === 0) {
      record.pendingDraft = null
      record.state = {
        ...record.state,
        status: EDITOR_SAVE_STATES.saved,
        dirtyPartitions: [],
        errorCode: null,
      }
      this.persistScriptRecovery(record, candidate, [])
      this.emit(record)
      return null
    }

    const pendingVersion = record.pendingVersion
    this.persistScriptRecovery(record, candidate, dirtyPartitions)
    record.state = {
      ...record.state,
      status: EDITOR_SAVE_STATES.saving,
      dirtyPartitions,
      errorCode: null,
    }
    this.emit(record)

    const request = this.api.saveDraft(projectId, candidate, {
      expectedRevision: record.baseline.revision ?? 0,
      partitions: dirtyPartitions,
      reason,
    })
    record.inFlight = request

    try {
      const result = await request
      record.baseline = cloneDraft(result.draft)
      record.state.revision = result.revision
      record.state.lastSavedAt = result.savedAt

      if (record.pendingVersion === pendingVersion) {
        record.pendingDraft = null
      }

      const remainingDirtyPartitions = record.pendingDraft
        ? resolveEditorDirtyPartitions(record.baseline, record.pendingDraft)
        : []

      record.state = {
        ...record.state,
        status: remainingDirtyPartitions.length > 0 ? EDITOR_SAVE_STATES.dirty : EDITOR_SAVE_STATES.saved,
        dirtyPartitions: remainingDirtyPartitions,
        errorCode: null,
      }
      this.persistScriptRecovery(record, record.pendingDraft ?? record.baseline, remainingDirtyPartitions)
      this.emit(record)

      if (remainingDirtyPartitions.length > 0) {
        record.timer = globalThis.setTimeout(() => {
          record.timer = null
          void this.flush(projectId, undefined, 'autosave').catch(() => undefined)
        }, this.autosaveDelayMs)
      }

      return result
    } catch (error) {
      const errorCode = resolveErrorCode(error)
      record.state = {
        ...record.state,
        status:
          errorCode === API_ERROR_CODES.editorSaveConflict ? EDITOR_SAVE_STATES.conflict : EDITOR_SAVE_STATES.error,
        dirtyPartitions,
        errorCode,
      }
      this.emit(record)
      throw error
    } finally {
      record.inFlight = null
    }
  }

  retry(projectId: string): Promise<SaveDraftResult | null> {
    return this.flush(projectId, undefined, 'retry')
  }

  async reload(projectId: string): Promise<EditorDraft> {
    const draft = await this.api.getDraft(projectId)
    this.recoveryStore.remove(projectId)
    return this.register(projectId, draft, draft.script.updatedAt || null)
  }

  async overwriteConflict(projectId: string): Promise<SaveDraftResult | null> {
    const record = this.records.get(projectId)
    if (!record) {
      throw new Error(API_ERROR_CODES.editorDraftNotLoaded)
    }

    const pendingDraft = record.pendingDraft ? cloneDraft(record.pendingDraft) : null
    const remoteDraft = await this.api.getDraft(projectId)
    record.baseline = cloneDraft(remoteDraft)
    record.state = {
      ...record.state,
      revision: remoteDraft.revision ?? 0,
      status: pendingDraft ? EDITOR_SAVE_STATES.dirty : EDITOR_SAVE_STATES.saved,
      dirtyPartitions: pendingDraft ? resolveEditorDirtyPartitions(remoteDraft, pendingDraft) : [],
      errorCode: null,
    }
    record.pendingDraft = pendingDraft
    this.emit(record)

    return this.flush(projectId, undefined, 'conflict-overwrite')
  }

  dispose(projectId: string): void {
    const record = this.records.get(projectId)
    if (!record) {
      return
    }

    this.clearTimer(record)
    this.records.delete(projectId)
  }
}

export const editorPersistenceService = new EditorPersistenceService()
