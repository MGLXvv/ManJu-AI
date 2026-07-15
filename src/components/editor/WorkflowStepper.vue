<template>
  <section class="workflow-stepper" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in editorSteps"
      :key="step.key"
      class="workflow-stepper__item"
      :class="{
        'is-active': isStepActive(step.route),
        'is-done': index < activeIndex,
        'is-disabled': !resolveStepCapability(step.route).available,
      }"
      :to="{ name: step.route, params: route.params }"
      :aria-label="buildEditorCapabilityAriaLabel(step.label, resolveStepCapability(step.route))"
      :aria-disabled="resolveStepCapability(step.route).available ? undefined : 'true'"
      :title="resolveStepCapability(step.route).message || undefined"
      @click="handleStepNavigation($event, step.route)"
    >
      <span class="workflow-stepper__dot" />
      <span>{{ step.label }}</span>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  buildEditorCapabilityAriaLabel,
  resolveEditorRouteCapabilityView,
} from '@/features/editor/editorCapabilityState'
import type { EditorRouteName } from '@/features/editor/editorRouteGuardState'
import { editorSteps } from '@/stores/editor'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const route = useRoute()
const uiFeedback = useUiFeedbackStore()

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

const resolveStepCapability = (stepRoute: string) => resolveEditorRouteCapabilityView(stepRoute as EditorRouteName)

const handleStepNavigation = (event: MouseEvent, stepRoute: string): void => {
  const capability = resolveStepCapability(stepRoute)
  if (capability.available) return

  event.preventDefault()
  uiFeedback.showToast(capability.message, { tone: 'info' })
}
</script>
