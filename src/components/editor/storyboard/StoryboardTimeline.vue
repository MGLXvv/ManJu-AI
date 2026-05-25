<template>
  <section class="storyboard-timeline">
    <button type="button" class="storyboard-timeline__nav">‹</button>

    <div class="storyboard-timeline__track">
      <StoryboardShotCard
        v-for="shot in shots"
        :key="shot.id"
        :shot="shot"
        :active="shot.id === activeShotId"
        @select="$emit('select', $event)"
        @upload="$emit('upload', $event)"
        @copy="$emit('copy', $event)"
        @delete="$emit('delete', $event)"
        @favorite="$emit('favorite', $event)"
      />

      <CreateBlankShotCard @create="$emit('create')" />
    </div>

    <button type="button" class="storyboard-timeline__nav">›</button>
  </section>
</template>

<script setup lang="ts">
import CreateBlankShotCard from './CreateBlankShotCard.vue'
import StoryboardShotCard from './StoryboardShotCard.vue'
import type { StoryboardShot } from '@/types/storyboard'

defineProps<{
  shots: StoryboardShot[]
  activeShotId: string
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'favorite', id: string): void
  (e: 'create'): void
}>()
</script>
