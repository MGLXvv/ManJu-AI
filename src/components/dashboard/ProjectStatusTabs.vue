<template>
  <div class="project-status-tabs">
    <button
      type="button"
      class="project-status-tabs__item"
      :class="{ 'is-active': modelValue === 'all' }"
      @click="$emit('update:modelValue', 'all')"
    >
      全部({{ total }})
    </button>

    <button
      type="button"
      class="project-status-tabs__item"
      :class="{ 'is-active': modelValue === 'in_progress' }"
      @click="$emit('update:modelValue', 'in_progress')"
    >
      进行中({{ inProgress }})
    </button>

    <button
      type="button"
      class="project-status-tabs__item"
      :class="{ 'is-active': modelValue === 'completed' }"
      @click="$emit('update:modelValue', 'completed')"
    >
      已完成({{ completed }})
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProjectStatus } from '@/types/project'

defineProps<{
  modelValue: 'all' | ProjectStatus
  total: number
  inProgress: number
  completed: number
}>()

defineEmits<{
  (e: 'update:modelValue', value: 'all' | ProjectStatus): void
}>()
</script>
