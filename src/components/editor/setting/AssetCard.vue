<template>
  <article
    class="asset-card"
    :class="[
      `asset-card--${asset.type}`,
      {
        'is-generating': asset.status === 'generating',
        'is-selected': isSelected,
        'is-expanded': isExpanded,
        'is-batch-mode': batchMode,
        'is-batch-selected': isBatchSelected,
      },
    ]"
    @click="handleCardClick"
  >
    <button
      v-if="batchMode"
      type="button"
      class="asset-card__batch-check"
      :class="{ 'is-active': isBatchSelected }"
      aria-label="选择素材"
      @click.stop="$emit('toggle-batch', asset.id)"
    >
      <span></span>
    </button>

    <div class="asset-card__base">
      <div v-if="asset.status === 'generating'" class="asset-card__main">
        <header class="asset-card__header">
          <h3 class="asset-card__title">{{ asset.title }}</h3>

          <div v-if="!batchMode" class="asset-card__actions">
            <button
              type="button"
              class="asset-card__favorite-btn"
              :class="{ 'is-active': asset.favorite }"
              aria-label="收藏"
              @click.stop="$emit('favorite', asset.id)"
            >
              <FigmaIcon :name="asset.favorite ? 'asset-star-purple' : 'asset-star-outline'" :size="16" />
            </button>
            <button type="button" class="asset-card__trash-btn" aria-label="删除" @click.stop="$emit('delete', asset.id)">
              <FigmaIcon name="asset-trash" :size="16" />
            </button>
          </div>
        </header>

        <AssetGeneratingCard :label="`${asset.title}生成中...`" />
      </div>

      <div v-else class="asset-card__content">
        <div class="asset-card__main">
          <header class="asset-card__header">
            <h3 class="asset-card__title">{{ asset.title }}</h3>

            <div v-if="!batchMode" class="asset-card__actions">
              <button
                type="button"
                class="asset-card__favorite-btn"
                :class="{ 'is-active': asset.favorite }"
                aria-label="收藏"
                @click.stop="$emit('favorite', asset.id)"
              >
                <FigmaIcon :name="asset.favorite ? 'asset-star-purple' : 'asset-star-outline'" :size="16" />
              </button>
              <button type="button" class="asset-card__trash-btn" aria-label="删除" @click.stop="$emit('delete', asset.id)">
                <FigmaIcon name="asset-trash" :size="16" />
              </button>
            </div>
          </header>

          <AssetImageStrip :images="displayImages" :title="asset.title" @preview="$emit('preview', asset)" />

          <AssetContentTabs v-if="isCharacter" v-model="activePanel" />
          <div v-else class="asset-card__single-label">提示词</div>

          <AssetPromptPanel v-if="!isCharacter || activePanel === 'prompt'" v-model="promptValue" />

          <AssetVoicePanel
            v-else
            v-model:selected-voice-id="selectedVoiceId"
            :voice-options="voiceOptions"
          />

          <div class="asset-card__footer">
            <AssetActionButtons @generate="$emit('generate', asset.id)" @upload="triggerUpload" />
            <footer class="asset-card__time">{{ asset.createdAt }}</footer>
          </div>
        </div>
      </div>
    </div>
    <AssetCandidateList
      v-if="showCandidateLibrary"
      class="asset-card__candidates"
      :images="candidateImages"
      :title="asset.title"
      :selected-index="selectedCandidateIndex"
      @select="onSelectCandidate"
    />
    <input ref="uploadRef" class="asset-card__upload-input" type="file" accept="image/*" @change="onFileChange" />
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AssetActionButtons from './AssetActionButtons.vue'
import AssetCandidateList from './AssetCandidateList.vue'
import AssetContentTabs from './AssetContentTabs.vue'
import AssetGeneratingCard from './AssetGeneratingCard.vue'
import AssetImageStrip from './AssetImageStrip.vue'
import AssetPromptPanel from './AssetPromptPanel.vue'
import AssetVoicePanel from './AssetVoicePanel.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { SettingAsset } from '@/types/settingAsset'

const props = defineProps<{
  asset: SettingAsset
  isSelected: boolean
  isExpanded: boolean
  batchMode?: boolean
  isBatchSelected?: boolean
}>()

const emit = defineEmits<{
  (e: 'generate', id: string): void
  (e: 'upload', payload: { id: string; imageUrl: string }): void
  (e: 'select-candidate', payload: { id: string; imageUrl: string }): void
  (e: 'preview', asset: SettingAsset): void
  (e: 'favorite', id: string): void
  (e: 'delete', id: string): void
  (e: 'select', id: string): void
  (e: 'toggle-batch', id: string): void
  (e: 'update', payload: { id: string; patch: Partial<SettingAsset> }): void
}>()

const uploadRef = ref<HTMLInputElement | null>(null)
const activePanel = ref<'prompt' | 'voice'>(props.asset.type === 'character' ? 'voice' : 'prompt')
const selectedVoiceId = ref(props.asset.selectedVoiceId ?? props.asset.voiceOptions?.[0]?.id ?? '')

const isCharacter = computed(() => props.asset.type === 'character')
const voiceOptions = computed(() => props.asset.voiceOptions ?? [])
const candidateImages = computed(() => props.asset.candidateImages ?? [])
const showCandidateLibrary = computed(() => props.isExpanded && candidateImages.value.length >= 2)
const selectedCandidateIndex = computed(() => {
  const currentImage = props.asset.imageUrls[0]
  if (!currentImage) {
    return 0
  }
  const currentIndex = candidateImages.value.findIndex((image) => image === currentImage)
  return currentIndex >= 0 ? currentIndex : 0
})

const displayImages = computed(() => {
  if (props.asset.imageUrls.length > 0) {
    return props.asset.imageUrls
  }
  return ['']
})

const promptValue = computed({
  get: () => props.asset.prompt,
  set: (value: string) => {
    emit('update', {
      id: props.asset.id,
      patch: { prompt: value },
    })
  },
})

watch(
  () => props.asset.id,
  () => {
    activePanel.value = props.asset.type === 'character' ? 'voice' : 'prompt'
    selectedVoiceId.value = props.asset.selectedVoiceId ?? props.asset.voiceOptions?.[0]?.id ?? ''
  },
)

watch(selectedVoiceId, (value) => {
  const selectedVoice = props.asset.voiceOptions?.find((item) => item.id === value)
  emit('update', {
    id: props.asset.id,
    patch: {
      selectedVoiceId: value,
      voiceId: value || undefined,
      voiceName: selectedVoice?.name,
    },
  })
})

const triggerUpload = (): void => {
  uploadRef.value?.click()
}

const onFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      emit('upload', { id: props.asset.id, imageUrl: reader.result })
    }
  }
  reader.readAsDataURL(file)

  if (target) {
    target.value = ''
  }
}

const onSelectCandidate = (payload: { image: string; index: number }): void => {
  emit('select-candidate', { id: props.asset.id, imageUrl: payload.image })
}

const handleCardClick = (): void => {
  if (props.batchMode) {
    emit('toggle-batch', props.asset.id)
    return
  }

  emit('select', props.asset.id)
}
</script>
