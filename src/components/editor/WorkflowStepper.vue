<template>
  <section class="workflow-stepper" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in editorSteps"
      :key="step.key"
      class="workflow-stepper__item"
      :class="{ 'is-active': isStepActive(step.route), 'is-done': index < activeIndex }"
      :to="{ name: step.route, params: route.params }"
    >
      <span class="workflow-stepper__dot" />
      <span>{{ step.label }}</span>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { editorSteps } from '@/stores/editor'

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
</script>
