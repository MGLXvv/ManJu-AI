<template>
  <div class="asset-audio">
    <div class="asset-audio__meta">
      <div ref="rootRef" class="asset-audio__meta-left">
        <button class="asset-audio__voice-trigger" type="button" @click="open = !open">
          <span>{{ selectedVoiceLabel }}</span>
          <FigmaIcon name="chevron-down" :size="14" class="asset-audio__voice-arrow" />
        </button>

        <div v-if="open" class="asset-audio__voice-menu">
          <button
            v-for="option in voiceOptions"
            :key="option.id"
            type="button"
            class="asset-audio__voice-option"
            :class="{ 'is-selected': option.id === selectedVoiceId }"
            @click="selectVoice(option.id)"
          >
            <span>{{ option.name }}</span>
            <small v-if="option.duration">{{ option.duration }}</small>
          </button>
        </div>
      </div>
    </div>

    <div class="asset-audio__wave-row">
      <span class="asset-audio__time">{{ formattedCurrentTime }}/{{ formattedDuration }}</span>
      <div class="asset-audio__waveform" aria-hidden="true">
        <span
          v-for="(item, index) in waveformBars"
          :key="index"
          class="asset-audio__bar"
          :style="{ height: `${item}px` }"
        />
      </div>
    </div>

    <button
      class="asset-audio__play"
      type="button"
      aria-label="播放"
      :disabled="!audioSrc"
      @click="togglePlayback"
    >
      <span class="asset-audio__play-icon" aria-hidden="true"></span>
    </button>

    <audio ref="audioRef" :src="audioSrc" preload="metadata" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { SettingAssetAudio, VoiceOption } from '@/types/settingAsset'

const props = defineProps<{
  audio: SettingAssetAudio
  selectedVoiceId: string
  voiceOptions: VoiceOption[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedVoiceId', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const open = ref(false)
const isPlaying = ref(false)
const currentSeconds = ref(0)
const durationSeconds = ref(0)
const waveformBars = ref<number[]>([])
const previewWaveformBars = ref<number[] | null>(null)

let audioContext: AudioContext | null = null
let analyserNode: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let frequencyData: Uint8Array | null = null
let rafId: number | null = null
let waveformLoadToken = 0

const createFallbackBars = (): number[] =>
  props.audio.waveform ?? Array.from({ length: 34 }, (_, i) => (i % 7) + 5)

const getIdleWaveformBars = (): number[] => previewWaveformBars.value ?? createFallbackBars()

const selectedVoiceLabel = computed(() => {
  return props.voiceOptions.find((item) => item.id === props.selectedVoiceId)?.name ?? props.audio.title
})

const selectedVoice = computed(() => {
  return props.voiceOptions.find((item) => item.id === props.selectedVoiceId) ?? null
})

const audioSrc = computed(() => selectedVoice.value?.audioUrl ?? '')

const formattedCurrentTime = computed(() => formatHms(currentSeconds.value))
const formattedDuration = computed(() => formatHms(durationSeconds.value))

const selectVoice = (id: string): void => {
  stopPlayback()
  emit('update:selectedVoiceId', id)
  open.value = false
}

const parseDurationSeconds = (value: string): number => {
  const parts = value
    .trim()
    .split(':')
    .map((part) => Number(part))
    .filter((num) => Number.isFinite(num))

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 1) {
    return parts[0]
  }
  return 0
}

const formatHms = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((item) => String(item).padStart(2, '0')).join(':')
}

const buildPreviewWaveformBars = (samples: Float32Array, count = 34): number[] => {
  if (!samples.length) {
    return createFallbackBars()
  }

  const blockSize = Math.max(1, Math.floor(samples.length / count))
  return Array.from({ length: count }, (_, index) => {
    const start = index * blockSize
    const end = Math.min(samples.length, start + blockSize)
    let peak = 0

    for (let cursor = start; cursor < end; cursor += 1) {
      const amplitude = Math.abs(samples[cursor] ?? 0)
      if (amplitude > peak) {
        peak = amplitude
      }
    }

    return Math.max(3, Math.min(20, Math.round(peak * 18) + 3))
  })
}

const loadPreviewWaveform = async (): Promise<void> => {
  const src = audioSrc.value.trim()
  if (!src) {
    previewWaveformBars.value = null
    if (!isPlaying.value) {
      waveformBars.value = createFallbackBars()
    }
    return
  }

  const currentToken = ++waveformLoadToken

  try {
    const response = await fetch(src)
    const arrayBuffer = await response.arrayBuffer()
    const decodeContext = new AudioContext()

    try {
      const audioBuffer = await decodeContext.decodeAudioData(arrayBuffer.slice(0))
      if (currentToken !== waveformLoadToken) {
        return
      }

      const channelData = audioBuffer.getChannelData(0)
      previewWaveformBars.value = buildPreviewWaveformBars(channelData)
      if (!isPlaying.value) {
        waveformBars.value = getIdleWaveformBars()
      }
    } finally {
      void decodeContext.close()
    }
  } catch {
    if (currentToken !== waveformLoadToken) {
      return
    }
    previewWaveformBars.value = null
    if (!isPlaying.value) {
      waveformBars.value = createFallbackBars()
    }
  }
}

const syncWaveformFromAnalyser = (): void => {
  if (!analyserNode || !frequencyData) {
    return
  }

  analyserNode.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>)
  const barCount = waveformBars.value.length || 34
  const chunk = Math.max(1, Math.floor(frequencyData.length / barCount))
  const nextBars = Array.from({ length: barCount }, (_, index) => {
    const start = index * chunk
    const end = Math.min(frequencyData!.length, start + chunk)
    let sum = 0
    for (let i = start; i < end; i += 1) {
      sum += frequencyData![i]
    }
    const avg = sum / Math.max(1, end - start)
    return Math.max(3, Math.min(20, Math.round((avg / 255) * 20)))
  })

  waveformBars.value = nextBars
}

const startWaveformLoop = (): void => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  const loop = (): void => {
    if (!isPlaying.value) {
      return
    }
    syncWaveformFromAnalyser()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

const stopWaveformLoop = (): void => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

const ensureAudioGraph = async (): Promise<void> => {
  const element = audioRef.value
  if (!element) {
    return
  }

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(element)
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 128
    analyserNode.smoothingTimeConstant = 0.72
    sourceNode.connect(analyserNode)
    analyserNode.connect(audioContext.destination)
    frequencyData = new Uint8Array(analyserNode.frequencyBinCount)
  }
}

const stopPlayback = (): void => {
  const element = audioRef.value
  if (element) {
    element.pause()
    element.currentTime = 0
  }
  currentSeconds.value = 0
  isPlaying.value = false
  stopWaveformLoop()
  waveformBars.value = getIdleWaveformBars()
}

const togglePlayback = async (): Promise<void> => {
  const element = audioRef.value
  if (!element || !audioSrc.value) {
    return
  }

  if (isPlaying.value) {
    element.pause()
    return
  }

  await ensureAudioGraph()
  await element.play()
}

const onTimeUpdate = (): void => {
  const element = audioRef.value
  if (!element) {
    return
  }
  currentSeconds.value = element.currentTime
}

const onLoadedMetadata = (): void => {
  const element = audioRef.value
  if (!element) {
    return
  }
  if (Number.isFinite(element.duration) && element.duration > 0) {
    durationSeconds.value = element.duration
  }
  void loadPreviewWaveform()
}

const onPlay = (): void => {
  isPlaying.value = true
  startWaveformLoop()
}

const onPause = (): void => {
  isPlaying.value = false
  stopWaveformLoop()
  waveformBars.value = getIdleWaveformBars()
}

const onEnded = (): void => {
  isPlaying.value = false
  currentSeconds.value = 0
  stopWaveformLoop()
  waveformBars.value = getIdleWaveformBars()
}

const handleDocumentClick = (event: MouseEvent): void => {
  const target = event.target as Node | null
  if (!target || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(target)) {
    open.value = false
  }
}

onMounted(() => {
  waveformBars.value = createFallbackBars()
  durationSeconds.value = parseDurationSeconds(props.audio.duration)
  document.addEventListener('click', handleDocumentClick)
  audioRef.value?.addEventListener('timeupdate', onTimeUpdate)
  audioRef.value?.addEventListener('loadedmetadata', onLoadedMetadata)
  audioRef.value?.addEventListener('play', onPlay)
  audioRef.value?.addEventListener('pause', onPause)
  audioRef.value?.addEventListener('ended', onEnded)
  void loadPreviewWaveform()
})

onBeforeUnmount(() => {
  stopPlayback()
  waveformLoadToken += 1
  audioRef.value?.removeEventListener('timeupdate', onTimeUpdate)
  audioRef.value?.removeEventListener('loadedmetadata', onLoadedMetadata)
  audioRef.value?.removeEventListener('play', onPlay)
  audioRef.value?.removeEventListener('pause', onPause)
  audioRef.value?.removeEventListener('ended', onEnded)
  document.removeEventListener('click', handleDocumentClick)
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  analyserNode = null
  sourceNode = null
  frequencyData = null
})

watch(
  () => props.audio.duration,
  (next) => {
    if (!isPlaying.value) {
      durationSeconds.value = parseDurationSeconds(next)
    }
  },
)

watch(
  () => props.audio.waveform,
  () => {
    if (!isPlaying.value && !previewWaveformBars.value) {
      waveformBars.value = createFallbackBars()
    }
  },
)

watch(audioSrc, () => {
  previewWaveformBars.value = null
  stopPlayback()
  void loadPreviewWaveform()
})
</script>
