<template>
  <header class="script-topbar">
    <button class="script-model-select" type="button">
      <FigmaIcon name="editor-ai-optimize" :size="16" />
      <span>Gpt 4.0</span>
      <span class="script-model-select__caret">⌄</span>
    </button>

    <button class="script-topbar__next" type="button" @click="$emit('next')">进入分镜</button>
  </header>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'next'): void
}>()
</script>
