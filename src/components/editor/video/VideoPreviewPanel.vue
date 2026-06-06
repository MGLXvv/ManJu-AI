<template>
  <section class="video-preview-panel">
    <div class="video-preview-panel__canvas">
      <template v-if="shot.status === 'generating' || shot.status === 'pending'">
        <div class="video-preview-panel__loading">视频生成中...</div>
      </template>
      <template v-else-if="hasPlayableVideo">
        <video
          ref="videoRef"
          class="video-preview-panel__media"
          :poster="shot.imageUrl || undefined"
          :src="videoSrc || undefined"
          preload="metadata"
          playsinline
          muted
        ></video>
      </template>
      <template v-else-if="shot.imageUrl">
        <img class="video-preview-panel__media" :src="shot.imageUrl" :alt="shot.title" />
        <div v-if="hasMockVideo" class="video-preview-panel__mock-badge">已生成模拟视频</div>
      </template>
      <template v-else>
        <div class="video-preview-panel__empty">当前镜头暂无视频预览</div>
      </template>

      <button type="button" class="video-preview-panel__play" :aria-label="isPlaying ? '暂停预览' : '播放预览'" @click="togglePlay">
        <FigmaIcon name="video-play-large" :size="32" />
      </button>

      <div class="video-preview-panel__progress">
        <span>00:00</span>
        <div class="video-preview-panel__progress-track">
          <i class="video-preview-panel__progress-bar"></i>
        </div>
        <span>{{ durationLabel }}</span>
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
import { computed, ref } from 'vue'
import StoryboardCanvasToolbar from '@/components/editor/storyboard/StoryboardCanvasToolbar.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
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

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)

const videoSrc = computed(() => props.shot.videoUrl ?? '')
const hasPlayableVideo = computed(() => Boolean(videoSrc.value && !videoSrc.value.startsWith('mock-video://')))
const hasMockVideo = computed(() => Boolean(videoSrc.value && videoSrc.value.startsWith('mock-video://')))
const durationLabel = computed(() => `00:${String(props.shot.durationSeconds ?? 10).padStart(2, '0')}`)

const togglePlay = async (): Promise<void> => {
  const video = videoRef.value
  if (!video || !videoSrc.value || !hasPlayableVideo.value) return

  if (video.paused) {
    await video.play()
    isPlaying.value = true
    return
  }

  video.pause()
  isPlaying.value = false
}
</script>
