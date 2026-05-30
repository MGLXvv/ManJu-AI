<template>
  <button type="button" class="create-blank-shot-card" @click="$emit('create')">
    <FigmaIcon name="card-add" :size="18" />
    <small>创建空白分镜</small>
  </button>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'create'): void
}>()
</script>
