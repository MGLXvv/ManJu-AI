<template>
  <div class="asset-audio">
    <div class="asset-audio__meta">
      <span>{{ audio.title }}</span>
      <span>{{ audio.currentTime }}/{{ audio.duration }}</span>
    </div>

    <div class="asset-audio__waveform" aria-hidden="true">
      <span
        v-for="(item, index) in bars"
        :key="index"
        class="asset-audio__bar"
        :style="{ height: `${item}px` }"
      />
    </div>

    <button class="asset-audio__play" type="button" aria-label="播放">
      <span class="asset-audio__play-icon" aria-hidden="true"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SettingAssetAudio } from '@/types/settingAsset'

const props = defineProps<{
  audio: SettingAssetAudio
}>()

const bars = computed(() => props.audio.waveform ?? Array.from({ length: 34 }, (_, i) => (i % 7) + 5))
</script>

