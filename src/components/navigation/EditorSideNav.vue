<template>
  <aside class="editor-side-nav" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in editorSteps"
      :key="step.key"
      class="editor-side-nav__item"
      :class="{
        'is-active': isStepActive(step.route),
        'is-done': index < activeIndex,
      }"
      :to="{ name: step.route, params: route.params }"
      :aria-label="step.label"
    >
      <span class="editor-side-nav__icon-wrap">
        <FigmaIcon class="editor-side-nav__icon" :name="resolveIcon(step.key)" :size="24" />
      </span>
      <span class="editor-side-nav__label">{{ resolveLabel(step.key) }}</span>
      <span v-if="index < editorSteps.length - 1" class="editor-side-nav__divider" aria-hidden="true" />
    </RouterLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { editorSteps } from '@/stores/editor'
import type { WorkflowStep } from '@/types/project'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'

const route = useRoute()

const resolveWorkflowRoute = (name: unknown): string | null => {
  if (name === 'editor-script-input' || name === 'editor-script-storyboard') {
    return 'editor-script-input'
  }

  return typeof name === 'string' ? name : null
}

const activeIndex = computed(() => {
  const activeRoute = resolveWorkflowRoute(route.name)
  return editorSteps.findIndex((step) => step.route === activeRoute)
})

const isStepActive = (stepRoute: string): boolean => {
  return resolveWorkflowRoute(route.name) === stepRoute
}

const resolveIcon = (step: WorkflowStep): FigmaIconName => {
  const iconMap: Record<WorkflowStep, FigmaIconName> = {
    script: 'flow-script-edited',
    settings: 'flow-settings-edited',
    storyboard: 'flow-storyboard-edited',
    video: 'flow-video-edited',
    dubbing: 'flow-video-edited',
    complete: 'flow-complete-edited',
  }

  return iconMap[step] ?? 'flow-script-edited'
}

const resolveLabel = (step: WorkflowStep): string => {
  const labelMap: Record<WorkflowStep, string> = {
    script: '文案',
    settings: '设定',
    storyboard: '分镜',
    video: '视频',
    dubbing: '配音',
    complete: '完成',
  }

  return labelMap[step] ?? '文案'
}
</script>
