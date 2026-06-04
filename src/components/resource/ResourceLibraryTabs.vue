<template>
  <div class="resource-tabs">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="resource-tabs__item"
      :class="{ 'is-active': modelValue === item.value }"
      @click="$emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ResourceLibraryTab } from '@/types/resource'

defineProps<{
  modelValue: ResourceLibraryTab
}>()

defineEmits<{
  (e: 'update:modelValue', value: ResourceLibraryTab): void
}>()

const items: Array<{ label: string; value: ResourceLibraryTab }> = [
  { label: '创作资产', value: 'creative' },
  { label: '主体资产', value: 'subject' },
]
</script>
