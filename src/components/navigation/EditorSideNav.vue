<template>
  <aside class="editor-side-nav" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in navSteps"
      :key="step.key"
      class="editor-side-nav__item"
      :class="{
        'is-active': route.name === step.route,
        'is-done': index < activeIndex,
      }"
      :to="{ name: step.route, params: route.params }"
    >
      <span class="editor-side-nav__icon-wrap">
        <FigmaIcon class="editor-side-nav__icon" :name="resolveIcon(step.key, index)" :size="18" />
      </span>
      <span class="editor-side-nav__label">{{ step.shortLabel }}</span>
    </RouterLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { editorSteps } from '@/stores/editor'
import type { WorkflowStep } from '@/types/project'
import { FIGMA_ICON_LIBRARY, type FigmaIconName } from '@/components/icons/figmaIconLibrary'

const route = useRoute()
const activeIndex = computed(() => editorSteps.findIndex((step) => step.route === route.name))

const navSteps = editorSteps.map((step) => ({
  ...step,
  shortLabel: step.key === 'storyboard' ? '分镜' : step.key === 'settings' ? '设定' : step.key === 'script' ? '文案' : step.label.slice(0, 2),
}))

const resolveIcon = (step: WorkflowStep, index: number): FigmaIconName => {
  const state = index < activeIndex.value ? 'edited' : index === activeIndex.value ? 'editing' : 'unedited'
  const prefix =
    step === 'settings'
      ? 'setting'
      : step === 'dubbing'
        ? 'video'
        : step
  const candidate = `flow-${prefix}-${state}` as FigmaIconName
  return FIGMA_ICON_LIBRARY[candidate] ? candidate : 'flow-script-unedited'
}
</script>
