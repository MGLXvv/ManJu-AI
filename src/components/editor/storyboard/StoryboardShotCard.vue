<template>
  <article class="storyboard-shot-card" :class="{ 'is-active': active }" @click="$emit('select', shot.id)">
    <header class="storyboard-shot-card__header">
      <span>#{{ shot.index }}</span>
      <button type="button" aria-label="收藏" @click.stop="$emit('favorite', shot.id)">
        <Star :size="13" :fill="shot.isFavorite ? 'currentColor' : 'none'" />
      </button>
    </header>

    <div class="storyboard-shot-card__thumb">
      <img v-if="shot.imageUrl" :src="shot.imageUrl" :alt="shot.title" />
      <span v-else>空白分镜</span>
    </div>

    <footer class="storyboard-shot-card__actions">
      <button type="button" @click.stop="$emit('upload', shot.id)">上传</button>
      <button type="button" @click.stop="$emit('copy', shot.id)">复制</button>
      <button type="button" @click.stop="$emit('delete', shot.id)">删除</button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { Star } from 'lucide-vue-next'
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
