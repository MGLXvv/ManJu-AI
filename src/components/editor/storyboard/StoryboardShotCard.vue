<template>
  <article class="storyboard-shot-card" :class="{ 'is-active': active }" @click="$emit('select', shot.id)">
    <header class="storyboard-shot-card__header">
      <span>#{{ shot.index }}</span>
      <button type="button" :class="{ 'is-favorite': shot.isFavorite }" aria-label="鏀惰棌" @click.stop="$emit('favorite', shot.id)">
        <FigmaIcon :name="shot.isFavorite ? 'card-star-green' : 'card-star-outline'" :size="14" />
      </button>
    </header>

    <div class="storyboard-shot-card__thumb">
      <img v-if="shot.imageUrl" :src="shot.imageUrl" :alt="shot.title" />
      <span v-else>绌虹櫧鍒嗛暅</span>
    </div>

    <footer class="storyboard-shot-card__actions">
      <button type="button" aria-label="上传" :class="{ 'is-active': active }" @click.stop="$emit('upload', shot.id)">
        <FigmaIcon name="timeline-upload-default" :size="15" />
      </button>
      <button type="button" aria-label="复制" :class="{ 'is-active': active }" @click.stop="$emit('copy', shot.id)">
        <FigmaIcon name="timeline-copy-default" :size="15" />
      </button>
      <button type="button" aria-label="删除" :class="{ 'is-active': active }" @click.stop="$emit('delete', shot.id)">
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
}>()

defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'favorite', id: string): void
}>()
</script>

