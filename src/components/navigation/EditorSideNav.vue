<template>
  <aside class="editor-side-nav" aria-label="创作流程">
    <RouterLink
      v-for="(step, index) in editorSteps"
      :key="step.key"
      class="editor-side-nav__item"
      :class="{
        'is-active': route.name === step.route,
        'is-done': index < activeIndex,
      }"
      :to="{ name: step.route, params: route.params }"
    >
      <span class="editor-side-nav__index">{{ index + 1 }}</span>
      <span class="editor-side-nav__label">{{ step.label }}</span>
    </RouterLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { editorSteps } from '@/stores/editor'

const route = useRoute()
const activeIndex = computed(() => editorSteps.findIndex((step) => step.route === route.name))
</script>
