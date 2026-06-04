<template>
  <div class="asset-voice-panel">
    <AssetAudioControl
      v-if="selectedAudio"
      :audio="selectedAudio"
      :selected-voice-id="voiceIdProxy"
      :voice-options="voiceOptions"
      @update:selected-voice-id="voiceIdProxy = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AssetAudioControl from './AssetAudioControl.vue'
import type { SettingAssetAudio, VoiceOption } from '@/types/settingAsset'

const props = defineProps<{
  selectedVoiceId: string
  voiceOptions: VoiceOption[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedVoiceId', value: string): void
}>()

const voiceIdProxy = computed({
  get: () => props.selectedVoiceId,
  set: (value: string) => emit('update:selectedVoiceId', value),
})

const selectedAudio = computed<SettingAssetAudio | null>(() => {
  const voice = props.voiceOptions.find((item) => item.id === props.selectedVoiceId)
  if (!voice) {
    return null
  }
  return {
    title: voice.name,
    currentTime: '00:00',
    duration: voice.duration ?? '00:30',
    waveform: buildWaveform(voice.id),
  }
})

const buildWaveform = (seedText: string): number[] => {
  const seed = Array.from(seedText).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return Array.from({ length: 34 }, (_, i) => ((seed + i * 9) % 18) + 4)
}
</script>
