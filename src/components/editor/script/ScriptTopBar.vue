<template>
  <header class="script-topbar">
    <button class="script-model-select" type="button">
      <FigmaIcon name="model-openai" :size="16" />
      <span>Gpt 4.0</span>
      <span class="script-model-select__caret">鈱?/span>
    </button>

    <button class="script-topbar__next" type="button" @click="$emit('next')">杩涘叆鍒嗛暅</button>
  </header>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'next'): void
}>()
</script>

