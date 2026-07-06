<template>
  <article
    class="storyboard-shot-card"
    :class="{
      'is-active': active,
      'is-batch-mode': batchMode,
      'is-batch-selected': batchSelected,
      'is-hidden': Boolean(shot.isHidden),
      'is-locked': Boolean(shot.isLocked),
      'is-dragging': dragging,
      'is-generating': isGenerating,
    }"
    :draggable="draggable"
    @click="$emit('select', shot.id)"
    @dragstart="$emit('drag-start', shot.id, $event)"
    @dragend="$emit('drag-end')"
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
        <template v-if="isGenerating">
          <div class="storyboard-shot-card__loading">
            <div class="storyboard-shot-card__loading-line">
              <span class="storyboard-shot-card__loading-hourglass">⌛</span>
              <strong>镜头生成中...</strong>
            </div>
            <span class="storyboard-shot-card__loading-bar" aria-hidden="true">
              <span></span>
            </span>
          </div>
        </template>
        <video
          v-else-if="hasPlayableVideo"
          :src="shot.videoUrl || undefined"
          preload="metadata"
          muted
          playsinline
        ></video>
        <img v-else-if="shot.imageUrl" :src="shot.imageUrl" :alt="shot.title" />
        <span v-else>空白分镜</span>
      </div>

      <header class="storyboard-shot-card__header">
        <span class="storyboard-shot-card__index">{{ shotNumberLabel }}</span>
        <div class="storyboard-shot-card__meta">
          <span v-if="shot.isHidden" class="storyboard-shot-card__status-tag is-hidden">隐藏</span>
          <span v-if="shot.isLocked" class="storyboard-shot-card__status-tag is-locked">锁定</span>
        </div>
        <button
          v-if="!batchMode && showReview"
          type="button"
          class="storyboard-shot-card__star-btn"
          :class="{ 'is-favorite': isReviewed }"
          :aria-label="isReviewed ? '取消审核标记' : '标记审核完成'"
          @click.stop="$emit('review', shot.id)"
        >
          <span class="storyboard-shot-card__star-bg" aria-hidden="true"></span>
          <span class="storyboard-shot-card__star-icon" aria-hidden="true">
            <FigmaIcon :name="isReviewed ? 'card-star-orange' : 'card-star-outline'" :size="14" />
          </span>
        </button>
      </header>
    </div>

    <footer v-if="!batchMode && !isGenerating" class="storyboard-shot-card__actions">
      <button type="button" aria-label="上传" @click.stop="$emit('upload', shot.id)">
        <FigmaIcon name="timeline-upload-default" :size="15" />
        <span class="storyboard-shot-card__tooltip">上传</span>
      </button>
      <button type="button" aria-label="复制" @click.stop="$emit('copy', shot.id)">
        <FigmaIcon name="timeline-copy-default" :size="15" />
        <span class="storyboard-shot-card__tooltip">复制</span>
      </button>
      <button type="button" aria-label="删除" @click.stop="$emit('delete', shot.id)">
        <FigmaIcon name="timeline-delete-default" :size="15" />
        <span class="storyboard-shot-card__tooltip">删除</span>
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { StoryboardShot } from '@/types/storyboard'

type LegacyStoryboardFavorite = StoryboardShot & { isFavorite?: boolean }

const props = withDefaults(
  defineProps<{
    shot: StoryboardShot
    active: boolean
    batchMode?: boolean
    batchSelected?: boolean
    draggable?: boolean
    dragging?: boolean
    showReview?: boolean
    reviewActive?: boolean
  }>(),
  {
    showReview: true,
    reviewActive: undefined,
  },
)

const shotNumberLabel = computed(() => props.shot.title.replace(/^镜头\s*/, '镜头'))
const isGenerating = computed(() => props.shot.status === 'generating')
const hasPlayableVideo = computed(() => Boolean(props.shot.videoUrl && !props.shot.videoUrl.startsWith('mock-video://')))
const isReviewed = computed(() => props.reviewActive ?? Boolean(props.shot.storyboardReviewed ?? (props.shot as LegacyStoryboardFavorite).isFavorite))

defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'review', id: string): void
  (e: 'drag-start', id: string, event: DragEvent): void
  (e: 'drag-end'): void
}>()
</script>