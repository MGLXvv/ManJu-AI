<template>
  <header class="script-topbar">
    <EditorModelSelect />
    <button class="script-topbar__next" type="button" @click="$emit('next')">进入分镜</button>
  </header>
</template>

<script setup lang="ts">
import EditorModelSelect from '@/components/editor/common/EditorModelSelect.vue'

defineEmits<{
  (e: 'next'): void
}>()
</script>
