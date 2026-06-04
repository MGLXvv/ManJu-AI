<template>
  <article class="voice-card" :class="{ 'is-batch-mode': batchMode, 'is-batch-selected': selected, 'is-editing': editing }">
    <div class="voice-card__shell">
      <div class="voice-card__head" @click="batchMode ? $emit('toggle-select', voice.id) : undefined">
        <span class="voice-card__title">{{ voice.name }}</span>

        <button
          v-if="batchMode"
          type="button"
          class="voice-card__check"
          :class="{ 'is-active': selected }"
          aria-label="选择音色"
          @click.stop="$emit('toggle-select', voice.id)"
        >
          <span></span>
        </button>
        <template v-else>
          <button type="button" class="voice-card__more" aria-label="更多操作" @click.stop="menuOpen = !menuOpen">
            ⋮
          </button>
        </template>

        <div v-if="menuOpen && !batchMode" class="voice-card__menu">
          <button type="button" @click="handleEdit">编辑</button>
          <button type="button" @click="handleDelete">删除</button>
        </div>
      </div>

      <div class="voice-card__player">
        <VoiceAudioPlayer :src="voice.audioUrl" :duration="voice.duration" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VoiceAudioPlayer from './VoiceAudioPlayer.vue'
import type { VoiceAsset } from '@/types/voice'

const props = defineProps<{
  voice: VoiceAsset
  batchMode?: boolean
  selected?: boolean
  editing?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'toggle-select', id: string): void
}>()

const menuOpen = ref(false)

const handleEdit = (): void => {
  menuOpen.value = false
  emit('edit', props.voice.id)
}

const handleDelete = (): void => {
  menuOpen.value = false
  emit('delete', props.voice.id)
}
</script>
