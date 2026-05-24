<template>
  <div class="project-status-tabs">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="project-status-tabs__item"
      :class="{ 'is-active': modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProjectStatus } from '@/types/project'

defineProps<{
  modelValue: 'all' | ProjectStatus
}>()

defineEmits<{
  (e: 'update:modelValue', value: 'all' | ProjectStatus): void
}>()

const options: Array<{ label: string; value: 'all' | ProjectStatus }> = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]
</script>
