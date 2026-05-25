<template>
  <button type="button" class="create-blank-shot-card" @click="$emit('create')">
    <span>+</span>
    <small>创建空白分镜</small>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'create'): void
}>()
</script>
