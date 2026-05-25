<template>
  <section class="storyboard-preview-panel">
    <div class="storyboard-canvas">
      <template v-if="shot.status === 'generating' || shot.status === 'pending'">
        <div class="storyboard-canvas__loading">等待抽图中...</div>
      </template>
      <template v-else-if="shot.imageUrl">
        <img class="storyboard-canvas__image" :src="shot.imageUrl" :alt="shot.title" />
      </template>
      <template v-else>
        <div class="storyboard-canvas__empty">当前镜头暂无预览图</div>
      </template>
    </div>

    <StoryboardCanvasToolbar
      @edit="$emit('edit-shot', shot.id)"
      @view="$emit('view-shot', shot.id)"
      @lock="$emit('lock-shot', shot.id)"
      @zoom="$emit('zoom-shot', shot.id)"
      @copy="$emit('copy-shot', shot.id)"
      @delete="$emit('delete-shot', shot.id)"
    />
  </section>
</template>

<script setup lang="ts">
import StoryboardCanvasToolbar from './StoryboardCanvasToolbar.vue'
import type { StoryboardShot } from '@/types/storyboard'

defineProps<{
  shot: StoryboardShot
}>()

defineEmits<{
  (e: 'edit-shot', id: string): void
  (e: 'view-shot', id: string): void
  (e: 'lock-shot', id: string): void
  (e: 'zoom-shot', id: string): void
  (e: 'copy-shot', id: string): void
  (e: 'delete-shot', id: string): void
}>()
</script>
