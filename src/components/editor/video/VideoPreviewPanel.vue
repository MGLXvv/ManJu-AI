<template>
  <section class="video-preview-panel">
    <div class="video-preview-panel__canvas">
      <div class="video-preview-panel__stage" :class="{ 'is-portrait': shot.ratio === '9:16' }">
        <template v-if="shot.status === 'generating'">
          <div class="video-preview-panel__loading">视频生成中...</div>
        </template>
        <template v-else-if="hasPlayableVideo">
          <video
            ref="videoRef"
            class="video-preview-panel__media"
            :src="videoSrc || undefined"
            preload="auto"
            playsinline
            :muted="isMuted"
            @play="handlePlay"
            @pause="handlePause"
            @ended="handleEnded"
            @loadedmetadata="initializePreviewFrame"
            @loadeddata="initializePreviewFrame"
            @timeupdate="syncTimeline"
          ></video>
        </template>
        <template v-else-if="shot.imageUrl">
          <img class="video-preview-panel__media" :src="shot.imageUrl" :alt="shot.title" />
          <div v-if="hasMockVideo" class="video-preview-panel__mock-badge">已生成模拟视频</div>
        </template>
        <template v-else>
          <div class="video-preview-panel__empty">当前镜头暂无视频预览</div>
        </template>

        <button
          type="button"
          class="video-preview-panel__floating-play"
          :aria-label="isPlaying ? '暂停预览' : '播放预览'"
          :disabled="!hasPlayableVideo"
          @click="togglePlay"
        >
          <span class="video-preview-panel__play-frame" aria-hidden="true"></span>
          <span class="video-preview-panel__play-icon" aria-hidden="true"></span>
        </button>

        <div class="video-preview-panel__stage-footer">
          <div class="video-preview-panel__meta-main">
            <div class="video-preview-panel__transport">
              <div class="video-preview-panel__progress video-preview-panel__progress--stacked">
                <div class="video-preview-panel__progress-track">
                  <i class="video-preview-panel__progress-bar" :style="{ width: `${progressPercent}%` }"></i>
                </div>
                <input
                  class="video-preview-panel__progress-input"
                  type="range"
                  min="0"
                  :max="durationSeconds"
                  step="0.1"
                  :value="currentTime"
                  :disabled="!hasPlayableVideo"
                  aria-label="视频进度"
                  @input="handleSeekInput"
                />
              </div>
              <div class="video-preview-panel__transport-controls">
                <div class="video-preview-panel__transport-group video-preview-panel__transport-group--left">
                  <span class="video-preview-panel__time">{{ currentTimeLabel }}</span>
                  <div class="video-preview-panel__controls">
                    <button
                      type="button"
                      class="video-preview-panel__control-button"
                      aria-label="后退5秒"
                      :disabled="!hasPlayableVideo"
                      @click="seekBy(-5)"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M5.33333 7.55537L12.1485 3.01199C12.3016 2.90988 12.5085 2.95126 12.6107 3.10444C12.6472 3.1592 12.6667 3.22354 12.6667 3.28934V12.7103C12.6667 12.8944 12.5174 13.0436 12.3333 13.0436C12.2675 13.0436 12.2032 13.0242 12.1485 12.9877L5.33333 8.4443V12.6665C5.33333 13.0347 5.03485 13.3332 4.66667 13.3332C4.29848 13.3332 4 13.0347 4 12.6665V3.33317C4 2.96498 4.29848 2.6665 4.66667 2.6665C5.03485 2.6665 5.33333 2.96498 5.33333 3.33317V7.55537Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="video-preview-panel__control-button"
                      aria-label="前进5秒"
                      :disabled="!hasPlayableVideo"
                      @click="seekBy(5)"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M10.6666 8.4443L3.85155 12.9877C3.69837 13.0898 3.49141 13.0484 3.38929 12.8952C3.35279 12.8405 3.33331 12.7762 3.33331 12.7103V3.28934C3.33331 3.10525 3.48255 2.95601 3.66665 2.95601C3.73245 2.95601 3.79679 2.97549 3.85155 3.01199L10.6666 7.55537V3.33317C10.6666 2.96498 10.9651 2.6665 11.3333 2.6665C11.7015 2.6665 12 2.96498 12 3.33317V12.6665C12 13.0347 11.7015 13.3332 11.3333 13.3332C10.9651 13.3332 10.6666 13.0347 10.6666 12.6665V8.4443Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="video-preview-panel__transport-group video-preview-panel__transport-group--right">
                  <button
                    type="button"
                    class="video-preview-panel__control-button video-preview-panel__control-button--mute"
                    :aria-label="isMuted ? '恢复声音' : '静音'"
                    :disabled="!hasPlayableVideo"
                    @click="toggleMute"
                  >
                    <svg v-if="!isMuted" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M4.95211 7.50005L7.50003 5.4154V12.5847L4.95211 10.5001H2.25003V7.50005H4.95211ZM1.50003 12.0001H4.41671L8.38759 15.2489C8.45456 15.3038 8.53848 15.3338 8.62503 15.3338C8.8321 15.3338 9.00003 15.1658 9.00003 14.9588V3.04135C9.00003 2.95481 8.97011 2.87088 8.91529 2.80384C8.78411 2.64355 8.54785 2.61993 8.38759 2.75107L4.41671 6.00005H1.50003C1.08582 6.00005 0.750031 6.33583 0.750031 6.75005V11.2501C0.750031 11.6643 1.08582 12.0001 1.50003 12.0001ZM15.75 9.00005C15.75 11.4691 14.6654 13.6848 12.9466 15.1967L11.8832 14.1333C13.3318 12.8953 14.25 11.0549 14.25 9.00005C14.25 6.94512 13.3318 5.10475 11.8832 3.86677L12.9466 2.80338C14.6654 4.31529 15.75 6.53097 15.75 9.00005ZM12 9.00005C12 7.56714 11.3296 6.29003 10.2854 5.46597L9.21353 6.53778C9.99143 7.07982 10.5 7.98091 10.5 9.00005C10.5 10.0192 9.99143 10.9203 9.21353 11.4623L10.2854 12.5341C11.3296 11.7101 12 10.4329 12 9.00005Z" fill="currentColor"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M4.95211 7.50005L7.50003 5.4154V12.5847L4.95211 10.5001H2.25003V7.50005H4.95211ZM1.50003 12.0001H4.41671L8.38759 15.2489C8.45456 15.3038 8.53848 15.3338 8.62503 15.3338C8.8321 15.3338 9.00003 15.1658 9.00003 14.9588V3.04135C9.00003 2.95481 8.97011 2.87088 8.91529 2.80384C8.78411 2.64355 8.54785 2.61993 8.38759 2.75107L4.41671 6.00005H1.50003C1.08582 6.00005 0.750031 6.33583 0.750031 6.75005V11.2501C0.750031 11.6643 1.08582 12.0001 1.50003 12.0001Z" fill="currentColor"/>
                      <path d="M11.1602 6.21973L14.7805 9.84006" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      <path d="M14.7803 6.21973L11.16 9.84006" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                  <span class="video-preview-panel__time">{{ durationLabel }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <StoryboardCanvasToolbar
      :is-hidden="false"
      :is-locked="Boolean(shot.isLocked)"
      :tool-states="toolStates"
      :show-hidden-toggle="false"
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
import { computed, ref, watch } from 'vue'
import StoryboardCanvasToolbar from '@/components/editor/storyboard/StoryboardCanvasToolbar.vue'
import { resolveStoryboardToolAvailability, type StoryboardToolAction } from '@/features/editor/storyboardModeState'
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
const isMuted = ref(false)
const currentTime = ref(0)
const actualDuration = ref(0)
const previewFrameInitialized = ref(false)

const videoSrc = computed(() => props.shot.videoUrl ?? '')
const hasPlayableVideo = computed(() => Boolean(videoSrc.value && !videoSrc.value.startsWith('mock-video://')))
const hasMockVideo = computed(() => Boolean(videoSrc.value && videoSrc.value.startsWith('mock-video://')))
const durationSeconds = computed(() => actualDuration.value || props.shot.durationSeconds || 10)
const durationLabel = computed(() => formatTime(durationSeconds.value))
const currentTimeLabel = computed(() => formatTime(currentTime.value))
const progressPercent = computed(() => {
  if (!durationSeconds.value) return 0
  return Math.min(100, Math.max(0, (currentTime.value / durationSeconds.value) * 100))
})
const toolStates = computed(() =>
  (
    ['edit', 'view', 'toggle-hidden', 'lock', 'zoom', 'copy', 'delete'] as StoryboardToolAction[]
  ).reduce<Record<StoryboardToolAction, ReturnType<typeof resolveStoryboardToolAvailability>>>((result, action) => {
    result[action] = resolveStoryboardToolAvailability({
      mode: 'image',
      action,
      isLocked: Boolean(props.shot.isLocked),
    })
    return result
  }, {} as Record<StoryboardToolAction, ReturnType<typeof resolveStoryboardToolAvailability>>),
)

watch(
  videoSrc,
  () => {
    isPlaying.value = false
    isMuted.value = false
    currentTime.value = 0
    actualDuration.value = 0
    previewFrameInitialized.value = false
  },
  { immediate: true },
)

const formatTime = (value: number): string => {
  const totalSeconds = Math.max(0, Math.floor(value))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const syncTimeline = (): void => {
  const video = videoRef.value
  if (!video) return
  currentTime.value = Number.isFinite(video.currentTime) ? video.currentTime : 0
  actualDuration.value = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
  isMuted.value = video.muted
}

const initializePreviewFrame = (): void => {
  const video = videoRef.value
  if (!video || !hasPlayableVideo.value || previewFrameInitialized.value) return

  previewFrameInitialized.value = true

  const previewTime = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(0.1, video.duration / 10) : 0
  if (previewTime > 0 && video.currentTime === 0) {
    try {
      video.currentTime = previewTime
    } catch {
      // Ignore browsers that block early seek before enough data is buffered.
    }
  }

  syncTimeline()
}

const handlePlay = (): void => {
  isPlaying.value = true
  syncTimeline()
}

const handlePause = (): void => {
  isPlaying.value = false
  syncTimeline()
}

const handleEnded = (): void => {
  isPlaying.value = false
  syncTimeline()
}

const seekTo = (value: number): void => {
  const video = videoRef.value
  if (!video || !hasPlayableVideo.value) return
  const nextTime = Math.min(durationSeconds.value || 0, Math.max(0, value))
  video.currentTime = nextTime
  currentTime.value = nextTime
}

const seekBy = (deltaSeconds: number): void => {
  seekTo(currentTime.value + deltaSeconds)
}

const handleSeekInput = (event: Event): void => {
  const input = event.target as HTMLInputElement
  seekTo(Number(input.value))
}

const toggleMute = (): void => {
  const video = videoRef.value
  if (!video || !hasPlayableVideo.value) return
  video.muted = !video.muted
  isMuted.value = video.muted
}

const togglePlay = async (): Promise<void> => {
  const video = videoRef.value
  if (!video || !videoSrc.value || !hasPlayableVideo.value) return

  if (video.paused) {
    await video.play()
    isPlaying.value = true
    return
  }

  video.pause()
  handlePause()
}
</script>