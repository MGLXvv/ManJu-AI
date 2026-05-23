import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { WorkflowStep } from '@/types/project'

export const editorSteps: Array<{ key: WorkflowStep; label: string; route: string }> = [
  { key: 'script', label: '文案处理', route: 'editor-script' },
  { key: 'settings', label: '设定', route: 'editor-settings' },
  { key: 'storyboard', label: '分镜生成', route: 'editor-storyboard' },
  { key: 'video', label: '视频生成', route: 'editor-video' },
  { key: 'dubbing', label: '配音', route: 'editor-dubbing' },
  { key: 'complete', label: '完成', route: 'editor-complete' },
]

export const useEditorStore = defineStore('editor', () => {
  const currentStep = ref<WorkflowStep>('script')
  const activeStepIndex = computed(() => editorSteps.findIndex((step) => step.key === currentStep.value))

  return { currentStep, activeStepIndex }
})
