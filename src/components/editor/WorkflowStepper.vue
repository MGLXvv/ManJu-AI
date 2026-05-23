<template>
  <section class="workflow-stepper" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in editorSteps"
      :key="step.key"
      class="workflow-stepper__item"
      :class="{ 'is-active': route.name === step.route, 'is-done': index < activeIndex }"
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
const activeIndex = computed(() => editorSteps.findIndex((step) => step.route === route.name))
</script>
