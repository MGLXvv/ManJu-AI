import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { editorApi } from '@/api/editor.api'
import { buildDubbingDraftPatch } from '@/features/editor/dubbingDraftState'
import { buildSettingDraftPatch } from '@/features/editor/settingDraftState'
import { buildStoryboardDraftShots } from '@/features/editor/storyboardPersistState'
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

    draft.value = await editorApi.saveDraft(currentProjectId.value, draft.value)
  }

  const updateScriptContent = (content: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      script: {
        ...draft.value.script,
        content,
      },
    }
  }

  const updateScriptPrompt = (prompt: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      script: {
        ...draft.value.script,
        prompt,
      },
    }
  }

  const updateGeneratedScript = (generated: string): void => {
    if (!draft.value) {
      return
    }

    draft.value = {
      ...draft.value,
      script: {
        ...draft.value.script,
        generated,
      },
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
      shots: buildStoryboardDraftShots(shots),
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
