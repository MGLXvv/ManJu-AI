<template>
  <article class="dubbing-role-card">
    <header class="dubbing-role-card__header">
      <span class="dubbing-role-card__header-label">{{ title }}</span>
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

          <div class="dubbing-role-card__table-body">
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
              <div class="dubbing-role-card__line-action">
                <button
                  type="button"
                  class="dubbing-role-card__line-play"
                  :class="{ 'is-playing': playingLineId === line.id }"
                  :disabled="!line.audioUrl || line.status !== 'success'"
                  :aria-label="playingLineId === line.id ? `停止试听${line.shotLabel}` : `试听${line.shotLabel}`"
                  @click="$emit('preview-line', line.id)"
                >
                  <span v-if="playingLineId !== line.id" class="dubbing-role-card__line-play-icon" aria-hidden="true"></span>
                  <span v-else class="dubbing-role-card__line-pause-icon" aria-hidden="true">
                    <i></i>
                    <i></i>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="dubbing-role-card__footer">
      <span class="dubbing-role-card__time">{{ createdAt }}</span>

      <button type="button" class="dubbing-role-card__generate" @click="$emit('generate', id)">
        <span>生成</span>
        <span class="dubbing-role-card__generate-icon" aria-hidden="true"></span>
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
