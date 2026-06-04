<template>
  <div class="voice-audio-player" :class="{ 'is-disabled': !src }">
    <button type="button" class="voice-audio-player__play" :disabled="!src" @click="togglePlay">
      {{ playing ? '❚❚' : '▶' }}
    </button>

    <span class="voice-audio-player__time">{{ currentTimeLabel }} / {{ durationLabel }}</span>

    <input
      class="voice-audio-player__range"
      type="range"
      min="0"
      :max="sliderMax"
      :value="Math.min(currentTime, sliderMax)"
      :disabled="!src"
      @input="onSeek"
    />

    <button type="button" class="voice-audio-player__volume" :disabled="!src" @click="toggleMute">
      {{ muted ? '🔇' : '🔊' }}
    </button>

    <audio
      ref="audioRef"
      :src="src || undefined"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  duration?: number
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const muted = ref(false)
const currentTime = ref(0)
const resolvedDuration = ref(props.duration ?? 0)

watch(
  () => props.src,
  () => {
    playing.value = false
    muted.value = false
    currentTime.value = 0
    resolvedDuration.value = props.duration ?? 0
    const audio = audioRef.value
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
    }
  },
)

watch(
  () => props.duration,
  (value) => {
    if (!resolvedDuration.value) {
      resolvedDuration.value = value ?? 0
    }
  },
)

const sliderMax = computed(() => Math.max(resolvedDuration.value, 1))

const formatTime = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const currentTimeLabel = computed(() => formatTime(currentTime.value))
const durationLabel = computed(() => formatTime(resolvedDuration.value))

const togglePlay = async (): Promise<void> => {
  const audio = audioRef.value
  if (!audio || !props.src) return

  if (playing.value) {
    audio.pause()
    playing.value = false
    return
  }

  await audio.play()
  playing.value = true
}

const toggleMute = (): void => {
  const audio = audioRef.value
  if (!audio || !props.src) return
  muted.value = !muted.value
  audio.muted = muted.value
}

const onSeek = (event: Event): void => {
  const audio = audioRef.value
  const target = event.target as HTMLInputElement | null
  if (!audio || !target) return
  const next = Number(target.value)
  audio.currentTime = next
  currentTime.value = next
}

const onLoadedMetadata = (): void => {
  const audio = audioRef.value
  if (!audio) return
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    resolvedDuration.value = audio.duration
  }
}

const onTimeUpdate = (): void => {
  const audio = audioRef.value
  if (!audio) return
  currentTime.value = audio.currentTime
}

const onEnded = (): void => {
  playing.value = false
  currentTime.value = 0
}
</script>
