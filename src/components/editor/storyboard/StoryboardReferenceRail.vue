<template>
  <aside class="storyboard-reference-rail">
    <button type="button" class="storyboard-reference-rail__toggle" aria-label="收起参考图">›</button>

    <div class="storyboard-reference-rail__list">
      <button
        v-for="image in images"
        :key="image.id"
        type="button"
        class="storyboard-reference-rail__item"
        @click="$emit('select', image.id)"
      >
        <img :src="image.url" :alt="image.id" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { StoryboardReferenceImage } from '@/types/storyboard'

defineProps<{
  images: StoryboardReferenceImage[]
}>()

defineEmits<{
  (e: 'select', id: string): void
}>()
</script>
