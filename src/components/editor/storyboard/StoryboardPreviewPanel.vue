<template>
  <section class="storyboard-preview-panel">
    <div class="storyboard-canvas" :class="{ 'is-generating': isGenerating }">
      <div class="storyboard-canvas__stage">
        <template v-if="isGenerating">
          <div class="storyboard-canvas__loading">绛夊緟鎶藉浘涓?..</div>
        </template>
        <template v-else-if="shot.imageUrl">
          <img class="storyboard-canvas__image" :src="shot.imageUrl" :alt="shot.title" />
        </template>
        <template v-else>
          <div class="storyboard-canvas__empty">当前镜头暂无预览图</div>
        </template>
      </div>
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
import { computed } from 'vue'
import StoryboardCanvasToolbar from './StoryboardCanvasToolbar.vue'
import type { StoryboardShot } from '@/types/storyboard'

const props = defineProps<{
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

const isGenerating = computed(() => props.shot.status === 'generating' || props.shot.status === 'pending')
</script>
