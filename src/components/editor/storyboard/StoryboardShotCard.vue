<template>
  <article
    class="storyboard-shot-card"
    :class="{ 'is-active': active, 'is-batch-mode': batchMode, 'is-batch-selected': batchSelected }"
    @click="$emit('select', shot.id)"
  >
    <button
      v-if="batchMode"
      type="button"
      class="storyboard-shot-card__batch-check"
      :class="{ 'is-active': batchSelected }"
      aria-label="选择分镜"
      @click.stop="$emit('select', shot.id)"
    >
      <span></span>
    </button>

    <div class="storyboard-shot-card__thumb-wrap">
      <div class="storyboard-shot-card__thumb">
        <img v-if="shot.imageUrl" :src="shot.imageUrl" :alt="shot.title" />
        <span v-else>空白分镜</span>
      </div>

      <header class="storyboard-shot-card__header">
        <span class="storyboard-shot-card__index">镜头{{ shot.index }}</span>
        <button
          v-if="!batchMode"
          type="button"
          class="storyboard-shot-card__star-btn"
          :class="{ 'is-favorite': shot.isFavorite }"
          aria-label="收藏"
          @click.stop="$emit('favorite', shot.id)"
        >
          <span class="storyboard-shot-card__star-bg" aria-hidden="true"></span>
          <span class="storyboard-shot-card__star-icon" aria-hidden="true">
            <FigmaIcon :name="shot.isFavorite ? 'card-star-orange' : 'card-star-outline'" :size="14" />
          </span>
        </button>
      </header>
    </div>

    <footer v-if="!batchMode" class="storyboard-shot-card__actions">
      <button type="button" aria-label="上传" @click.stop="$emit('upload', shot.id)">
        <FigmaIcon name="timeline-upload-default" :size="15" />
      </button>
      <button type="button" aria-label="复制" @click.stop="$emit('copy', shot.id)">
        <FigmaIcon name="timeline-copy-default" :size="15" />
      </button>
      <button type="button" aria-label="删除" @click.stop="$emit('delete', shot.id)">
        <FigmaIcon name="timeline-delete-default" :size="15" />
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { StoryboardShot } from '@/types/storyboard'

defineProps<{
  shot: StoryboardShot
  active: boolean
  batchMode?: boolean
  batchSelected?: boolean
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'favorite', id: string): void
}>()
</script>
