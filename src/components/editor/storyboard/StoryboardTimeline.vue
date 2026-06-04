<template>
  <section class="storyboard-timeline">
    <button type="button" class="storyboard-timeline__nav" aria-label="向左滑动分镜" @click="slideTrack(-1)">
      ‹
    </button>

    <div ref="trackRef" class="storyboard-timeline__track">
      <template v-for="(shot, index) in shots" :key="shot.id">
        <StoryboardShotCard
          :shot="shot"
          :active="shot.id === activeShotId"
          :batch-mode="batchMode"
          :batch-selected="(batchSelectedIds ?? []).includes(shot.id)"
          @select="$emit('select', $event)"
          @upload="$emit('upload', $event)"
          @copy="$emit('copy', $event)"
          @delete="$emit('delete', $event)"
          @favorite="$emit('favorite', $event)"
        />
        <span v-if="index < shots.length - 1" class="storyboard-shot-card__center-handle" aria-hidden="true">
          <FigmaIcon name="reference-rail-handle" :size="14" />
        </span>
      </template>
      <span v-if="shots.length > 0" class="storyboard-shot-card__center-handle" aria-hidden="true">
        <FigmaIcon name="reference-rail-handle" :size="14" />
      </span>

      <CreateBlankShotCard @create="$emit('create')" />
    </div>

    <button type="button" class="storyboard-timeline__nav" aria-label="向右滑动分镜" @click="slideTrack(1)">
      ›
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CreateBlankShotCard from './CreateBlankShotCard.vue'
import StoryboardShotCard from './StoryboardShotCard.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { StoryboardShot } from '@/types/storyboard'

defineProps<{
  shots: StoryboardShot[]
  activeShotId: string
  batchMode?: boolean
  batchSelectedIds?: string[]
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'favorite', id: string): void
  (e: 'create'): void
}>()

const trackRef = ref<HTMLElement | null>(null)

const slideTrack = (direction: 1 | -1): void => {
  const track = trackRef.value
  if (!track) return

  const distance = Math.max(track.clientWidth / 2, 1) * direction
  track.scrollBy({
    left: distance,
    behavior: 'smooth',
  })
}
</script>
