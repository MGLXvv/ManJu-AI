<template>
  <article class="dubbing-role-card">
    <header class="dubbing-role-card__header">
      <span class="dubbing-role-card__header-label">台词</span>
    </header>

    <div class="dubbing-role-card__body">
      <div class="dubbing-role-card__poster">
        <img v-if="imageUrl" :src="imageUrl" :alt="title" />
        <div v-else class="dubbing-role-card__poster-empty">
          <span>{{ title }}</span>
          <small>角色图将自动呈现</small>
        </div>
      </div>

      <div class="dubbing-role-card__voice-row">
        <span class="dubbing-role-card__voice-label">音色</span>
        <AssetVoiceSelect
          class="dubbing-role-card__voice-select"
          :model-value="selectedVoiceId"
          :options="voiceOptions"
          @update:model-value="$emit('update-voice', $event)"
        />
      </div>

      <section class="dubbing-role-card__dialogue">
        <header class="dubbing-role-card__section-title">台词</header>

        <div class="dubbing-role-card__table">
          <div class="dubbing-role-card__table-head">
            <span>位置</span>
            <span>台词</span>
            <span aria-hidden="true"></span>
          </div>

          <div v-for="line in lines" :key="line.id" class="dubbing-role-card__table-row">
            <span class="dubbing-role-card__line-shot">{{ line.shotLabel }}</span>
            <span class="dubbing-role-card__line-text-wrap">
              <span class="dubbing-role-card__line-text">{{ line.text }}</span>
              <span v-if="playingLineId === line.id" class="dubbing-role-card__line-playing" aria-hidden="true">
                <span class="dubbing-role-card__line-playing-label">正在试听</span>
                <span class="dubbing-role-card__line-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </span>
            </span>
            <button
              type="button"
              class="dubbing-role-card__line-play"
              :class="{ 'is-playing': playingLineId === line.id }"
              :disabled="!line.audioUrl || line.status !== 'success'"
              :aria-label="playingLineId === line.id ? `停止试听${line.shotLabel}` : `试听${line.shotLabel}`"
              @click="$emit('preview-line', line.id)"
            >
              <svg
                v-if="playingLineId !== line.id"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.40187 6.66673L6.66666 4.81371V11.1864L4.40187 9.3334H1.99999V6.66673H4.40187ZM1.33332 10.6667H3.92592L7.45559 13.5546C7.51512 13.6033 7.58972 13.6299 7.66666 13.6299C7.85072 13.6299 7.99999 13.4807 7.99999 13.2966V2.70346C7.99999 2.62651 7.97339 2.55193 7.92466 2.49238C7.80806 2.3499 7.59806 2.3289 7.45559 2.44547L3.92592 5.33338H1.33332C0.965136 5.33338 0.666656 5.63185 0.666656 6.00005V10.0001C0.666656 10.3683 0.965136 10.6667 1.33332 10.6667ZM15.3333 8C15.3333 10.1947 14.3693 12.1642 12.8415 13.5081L11.8963 12.5629C13.1839 11.4625 14 9.82653 14 8C14 6.17344 13.1839 4.53753 11.8963 3.43705L12.8415 2.49186C14.3693 3.83579 15.3333 5.8053 15.3333 8ZM12 8C12 6.72553 11.404 5.59032 10.4755 4.85782L9.52279 5.81056C10.2142 6.29237 10.6667 7.09333 10.6667 8C10.6667 8.90667 10.2142 9.7076 9.52279 10.1894L10.4755 11.1421C11.404 10.4097 12 9.2744 12 8Z"
                  fill="currentColor"
                />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="3" width="3" height="8" rx="1" fill="currentColor" />
                <rect x="8" y="3" width="3" height="8" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>

    <footer class="dubbing-role-card__footer">
      <span class="dubbing-role-card__time">{{ createdAt }}</span>

      <button type="button" class="dubbing-role-card__generate" @click="$emit('generate', id)">
        <span>生成</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.40187 6.66673L6.66666 4.81371V11.1864L4.40187 9.3334H1.99999V6.66673H4.40187ZM1.33332 10.6667H3.92592L7.45559 13.5546C7.51512 13.6033 7.58972 13.6299 7.66666 13.6299C7.85072 13.6299 7.99999 13.4807 7.99999 13.2966V2.70346C7.99999 2.62651 7.97339 2.55193 7.92466 2.49238C7.80806 2.3499 7.59806 2.3289 7.45559 2.44547L3.92592 5.33338H1.33332C0.965136 5.33338 0.666656 5.63185 0.666656 6.00005V10.0001C0.666656 10.3683 0.965136 10.6667 1.33332 10.6667ZM15.3333 8C15.3333 10.1947 14.3693 12.1642 12.8415 13.5081L11.8963 12.5629C13.1839 11.4625 14 9.82653 14 8C14 6.17344 13.1839 4.53753 11.8963 3.43705L12.8415 2.49186C14.3693 3.83579 15.3333 5.8053 15.3333 8ZM12 8C12 6.72553 11.404 5.59032 10.4755 4.85782L9.52279 5.81056C10.2142 6.29237 10.6667 7.09333 10.6667 8C10.6667 8.90667 10.2142 9.7076 9.52279 10.1894L10.4755 11.1421C11.404 10.4097 12 9.2744 12 8Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button type="button" class="dubbing-role-card__delete" aria-label="删除角色配音卡片" @click="$emit('delete', id)">
        <FigmaIcon name="asset-trash" :size="18" />
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import AssetVoiceSelect from '@/components/editor/setting/AssetVoiceSelect.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { DubbingRoleLineDraft } from '@/types/dubbing'
import type { VoiceOption } from '@/types/settingAsset'

defineProps<{
  id: string
  title: string
  imageUrl?: string
  selectedVoiceId: string
  voiceOptions: VoiceOption[]
  lines: DubbingRoleLineDraft[]
  createdAt: string
  playingLineId?: string | null
}>()

defineEmits<{
  (e: 'update-voice', value: string): void
  (e: 'preview-line', lineId: string): void
  (e: 'generate', id: string): void
  (e: 'delete', id: string): void
}>()
</script>
