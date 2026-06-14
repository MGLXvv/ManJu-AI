<template>
  <button type="button" class="insert-storyboard-shot-card" @click="$emit('insert')">
    <span class="insert-storyboard-shot-card__frame" aria-hidden="true"></span>
    <span class="insert-storyboard-shot-card__plus" aria-hidden="true">+</span>
    <span class="insert-storyboard-shot-card__label">插入新镜头</span>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'insert'): void
}>()
</script>
