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
      <span class="asset-candidate-list__label">{{ `${title}-候选${index + 1}` }}</span>
      <span v-if="index === selectedIndex" class="asset-candidate-list__check" aria-hidden="true">✓</span>
    </button>
  </aside>
</template>

<script setup lang="ts">

defineProps<{
  images: string[]
  selectedIndex: number
  title: string
}>()

defineEmits<{
  (e: 'select', payload: { image: string; index: number }): void
}>()
</script>

