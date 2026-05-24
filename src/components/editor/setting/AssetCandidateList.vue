<template>
  <aside class="asset-candidate-list">
    <button
      v-for="(image, index) in images"
      :key="`${image}-${index}`"
      type="button"
      class="asset-candidate-list__item"
      :class="{ 'is-selected': index === selectedIndex }"
      @click="$emit('select', { image, index })"
    >
      <img :src="image" :alt="`候选图 ${index + 1}`" />
      <Check v-if="index === selectedIndex" :size="12" class="asset-candidate-list__check" />
    </button>
  </aside>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineProps<{
  images: string[]
  selectedIndex: number
}>()

defineEmits<{
  (e: 'select', payload: { image: string; index: number }): void
}>()
</script>
