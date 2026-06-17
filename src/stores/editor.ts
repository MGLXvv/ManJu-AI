import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { editorApi } from '@/api/editor.api'
import {
  buildDubbingDraftPatch,
  buildScriptDraftPatch,
  buildSettingDraftPatch,
  buildStoryboardDraftPatch,
} from '@/features/editor/editorDraftMapper'
import { EDITOR_SAVE_STATES, type EditorSaveState } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { EditorDraft } from '@/types/editor'
import type { WorkflowStep } from '@/types/project'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

export const editorSteps: Array<{ key: WorkflowStep; label: string; route: string }> = [
  { key: 'script', label: '文案处理', route: 'editor-script' },
  { key: 'settings', label: '设定', route: 'editor-settings' },
  { key: 'storyboard', label: '分镜生成', route: 'editor-storyboard' },
  { key: 'video', label: '视频生成', route: 'editor-video' },
  { key: 'dubbing', label: '配音', route: 'editor-dubbing' },
  { key: 'complete', label: '完成', route: 'editor-complete' },
]

export const useEditorStore = defineStore('editor', () => {
  const currentProjectId = ref<string | null>(null)
  const currentStep = ref<WorkflowStep>('script')
  const loading = ref(false)
  const draft = ref<EditorDraft | null>(null)
  const saveState = ref<EditorSaveState>(EDITOR_SAVE_STATES.idle)
  const lastSavedAt = ref<string | null>(null)

  const activeStepIndex = computed(() => editorSteps.findIndex((step) => step.key === currentStep.value))

  const setCurrentStep = (step: WorkflowStep): void => {
    currentStep.value = step
  }

  const loadDraft = async (projectId: string): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      currentProjectId.value = projectId
      draft.value = await editorApi.getDraft(projectId)
    } finally {
      loading.value = false
    }
  }

  const saveDraft = async (): Promise<void> => {
    if (!currentProjectId.value || !draft.value) {
      return
    }

    saveState.value = EDITOR_SAVE_STATES.saving
    try {
      const result = await editorApi.saveDraft(currentProjectId.value, draft.value)
      draft.value = result.draft
      lastSavedAt.value = result.savedAt
      saveState.value = EDITOR_SAVE_STATES.saved
    } catch (error) {
      saveState.value = EDITOR_SAVE_STATES.error
      throw error
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
  }

  const updateScriptPrompt = (prompt: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { prompt }),
    }
  }

  const updateGeneratedScript = (generated: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildScriptDraftPatch(draft.value.script, { generated }),
    }
  }

  const updateSettingAssets = (assets: SettingAsset[]): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildSettingDraftPatch(assets),
    }
  }

  const updateStoryboardGenerationMode = (mode: 'multi-param' | 'image' | null): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      storyboardGenerationMode: mode,
    }
  }

  const updateStoryboardShots = (shots: StoryboardShot[]): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildStoryboardDraftPatch(shots),
    }
  }

  const updateDubbingDraft = (input: { modelId: string; cards: DubbingRoleCardModel[] }): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      ...buildDubbingDraftPatch(input),
    }
  }

  return {
    currentProjectId,
    currentStep,
    activeStepIndex,
    loading,
    draft,
    saveState,
    lastSavedAt,
    setCurrentStep,
    loadDraft,
    saveDraft,
    updateScriptContent,
    updateScriptPrompt,
    updateGeneratedScript,
    updateSettingAssets,
    updateStoryboardGenerationMode,
    updateStoryboardShots,
    updateDubbingDraft,
  }
})
