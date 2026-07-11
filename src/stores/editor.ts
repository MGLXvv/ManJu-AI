import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  buildScriptDraftPatch,
  buildSettingDraftPatch,
  buildStoryboardDraftPatch,
} from '@/features/editor/editorDraftMapper'
import { buildDubbingDraftUpdate } from '@/features/editor/dubbingDraftState'
import { EditorPersistenceService } from '@/services/editor/editorPersistence.service'
import { EDITOR_SAVE_STATES, type EditorSaveState } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type {
  EditorDraft,
  EditorPersistencePartition,
  EditorSaveReason,
  SaveDraftResult,
} from '@/types/editor'
import type { WorkflowStep } from '@/types/project'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

export const editorSteps: Array<{ key: WorkflowStep; label: string; route: string }> = [
  { key: 'script', label: '文案处理', route: 'editor-script-input' },
  { key: 'settings', label: '设定', route: 'editor-settings' },
  { key: 'storyboard', label: '分镜生成', route: 'editor-storyboard' },
  { key: 'video', label: '视频生成', route: 'editor-video' },
  { key: 'dubbing', label: '配音', route: 'editor-dubbing' },
  { key: 'complete', label: '完成', route: 'editor-complete' },
]

export const useEditorStore = defineStore('editor', () => {
  const persistence = new EditorPersistenceService()
  const currentProjectId = ref<string | null>(null)
  const currentStep = ref<WorkflowStep>('script')
  const loading = ref(false)
  const draft = ref<EditorDraft | null>(null)
  const saveState = ref<EditorSaveState>(EDITOR_SAVE_STATES.idle)
  const lastSavedAt = ref<string | null>(null)
  const dirtyPartitions = ref<EditorPersistencePartition[]>([])
  const saveErrorCode = ref<string | null>(null)

  const activeStepIndex = computed(() => editorSteps.findIndex((step) => step.key === currentStep.value))
  const revision = computed(() => draft.value?.revision ?? 0)
  const hasUnsavedChanges = computed(() => dirtyPartitions.value.length > 0)
  const hasSaveConflict = computed(() => saveState.value === EDITOR_SAVE_STATES.conflict)

  persistence.subscribe((state) => {
    if (state.projectId !== currentProjectId.value) {
      return
    }

    saveState.value = state.status
    lastSavedAt.value = state.lastSavedAt
    dirtyPartitions.value = [...state.dirtyPartitions]
    saveErrorCode.value = state.errorCode

    if (draft.value && draft.value.revision !== state.revision) {
      draft.value = {
        ...draft.value,
        revision: state.revision,
      }
    }
  })

  const setCurrentStep = (step: WorkflowStep): void => {
    currentStep.value = step
  }

  const loadDraft = async (projectId: string): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      if (currentProjectId.value && currentProjectId.value !== projectId) {
        persistence.dispose(currentProjectId.value)
      }

      currentProjectId.value = projectId
      draft.value = await persistence.load(projectId)
      const state = persistence.getState(projectId)
      saveState.value = state?.status ?? EDITOR_SAVE_STATES.idle
      lastSavedAt.value = state?.lastSavedAt ?? null
      dirtyPartitions.value = state?.dirtyPartitions ?? []
      saveErrorCode.value = state?.errorCode ?? null
    } finally {
      loading.value = false
    }
  }

  const applySaveResult = (result: SaveDraftResult | null): void => {
    if (!result || !draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      revision: result.revision,
      script: {
        ...draft.value.script,
        updatedAt: result.savedAt,
      },
    }
  }

  const saveDraft = async (reason: EditorSaveReason = 'manual'): Promise<void> => {
    if (!currentProjectId.value || !draft.value) {
      return
    }

    const result = await persistence.flush(currentProjectId.value, draft.value, reason)
    applySaveResult(result)
  }

  const scheduleDraftPersistence = (): void => {
    if (!currentProjectId.value || !draft.value) {
      return
    }

    persistence.track(currentProjectId.value, draft.value)
  }

  const retrySave = async (): Promise<void> => {
    if (!currentProjectId.value) {
      return
    }

    const result = await persistence.retry(currentProjectId.value)
    applySaveResult(result)
  }

  const reloadAfterConflict = async (): Promise<void> => {
    if (!currentProjectId.value) {
      return
    }

    draft.value = await persistence.reload(currentProjectId.value)
  }

  const overwriteConflict = async (): Promise<void> => {
    if (!currentProjectId.value) {
      return
    }

    const result = await persistence.overwriteConflict(currentProjectId.value)
    applySaveResult(result)
  }

  const flushPendingSave = async (reason: EditorSaveReason = 'navigation'): Promise<boolean> => {
    if (!currentProjectId.value || !draft.value || !hasUnsavedChanges.value) {
      return true
    }

    try {
      const result = await persistence.flush(currentProjectId.value, draft.value, reason)
      applySaveResult(result)
      return true
    } catch {
      return false
    }
  }

  const updateScriptContent = (content: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { content }),
    }
    scheduleDraftPersistence()
  }

  const updateScriptPrompt = (prompt: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { prompt }),
    }
    scheduleDraftPersistence()
  }

  const updateScriptOutline = (outline: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { outline }),
    }
    scheduleDraftPersistence()
  }

  const updateGeneratedScript = (generated: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { generated }),
    }
    scheduleDraftPersistence()
  }

  const updateStoryboardText = (storyboard: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { storyboard }),
    }
    scheduleDraftPersistence()
  }

  const updateSettingAssets = (assets: SettingAsset[]): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildSettingDraftPatch(assets),
    }
    scheduleDraftPersistence()
  }

  const updateStoryboardGenerationMode = (mode: 'multi-param' | 'image' | null): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      storyboardGenerationMode: mode,
    }
    scheduleDraftPersistence()
  }

  const updateStoryboardShots = (shots: StoryboardShot[]): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildStoryboardDraftPatch(shots),
    }
    scheduleDraftPersistence()
  }

  const updateDubbingDraft = (input: { modelId: string; cards: DubbingRoleCardModel[] }): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildDubbingDraftUpdate(draft.value, input),
    }
    scheduleDraftPersistence()
  }

  return {
    currentProjectId,
    currentStep,
    activeStepIndex,
    loading,
    draft,
    revision,
    saveState,
    lastSavedAt,
    dirtyPartitions,
    saveErrorCode,
    hasUnsavedChanges,
    hasSaveConflict,
    setCurrentStep,
    loadDraft,
    saveDraft,
    retrySave,
    reloadAfterConflict,
    overwriteConflict,
    flushPendingSave,
    updateScriptContent,
    updateScriptPrompt,
    updateScriptOutline,
    updateGeneratedScript,
    updateStoryboardText,
    updateSettingAssets,
    updateStoryboardGenerationMode,
    updateStoryboardShots,
    updateDubbingDraft,
  }
})
