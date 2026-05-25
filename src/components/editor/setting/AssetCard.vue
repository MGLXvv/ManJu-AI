<template>
  <article
    class="asset-card"
    :class="[
      `asset-card--${asset.type}`,
      {
        'is-generating': asset.status === 'generating',
        'is-selected': isSelected,
        'is-expanded': isExpanded,
      },
    ]"
    @click="$emit('select', asset.id)"
  >
    <div class="asset-card__base">
      <div v-if="asset.status === 'generating'" class="asset-card__main">
        <header class="asset-card__header">
          <h3 class="asset-card__title">{{ asset.title }}</h3>

          <div class="asset-card__actions">
            <button type="button" aria-label="收藏" @click.stop="$emit('favorite', asset.id)">
              <Star :size="15" :fill="asset.favorite ? 'currentColor' : 'none'" />
            </button>
            <button type="button" aria-label="删除" @click.stop="$emit('delete', asset.id)">
              <Trash2 :size="15" />
            </button>
          </div>
        </header>

        <AssetGeneratingCard :label="`${asset.title}生成中...`" />
      </div>

      <div v-else class="asset-card__content">
        <div class="asset-card__main">
          <header class="asset-card__header">
            <h3 class="asset-card__title">{{ asset.title }}</h3>

            <div class="asset-card__actions">
              <button type="button" aria-label="收藏" @click.stop="$emit('favorite', asset.id)">
                <Star :size="15" :fill="asset.favorite ? 'currentColor' : 'none'" />
              </button>
              <button type="button" aria-label="删除" @click.stop="$emit('delete', asset.id)">
                <Trash2 :size="15" />
              </button>
            </div>
          </header>

          <AssetImageStrip :images="displayImages" @preview="$emit('preview', asset)" />

          <AssetContentTabs v-if="isCharacter" v-model="activePanel" />
          <div v-else class="asset-card__single-label">提示词</div>

          <AssetPromptPanel v-if="!isCharacter || activePanel === 'prompt'" v-model="promptValue" />

          <AssetVoicePanel
            v-else
            v-model:selected-voice-id="selectedVoiceId"
            :voice-options="voiceOptions"
          />

          <AssetActionButtons @generate="$emit('generate', asset.id)" @upload="triggerUpload" />

          <footer class="asset-card__time">{{ asset.createdAt }}</footer>
        </div>
      </div>


    </div>
          <AssetCandidateList
        v-if="isExpanded"
        class="asset-card__candidates"
        :images="candidateImages"
        :selected-index="selectedCandidateIndex"
        @select="onSelectCandidate"
      />
    <input ref="uploadRef" class="asset-card__upload-input" type="file" accept="image/*" @change="onFileChange" />
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Star, Trash2 } from 'lucide-vue-next'
import AssetActionButtons from './AssetActionButtons.vue'
import AssetCandidateList from './AssetCandidateList.vue'
import AssetContentTabs from './AssetContentTabs.vue'
import AssetGeneratingCard from './AssetGeneratingCard.vue'
import AssetImageStrip from './AssetImageStrip.vue'
import AssetPromptPanel from './AssetPromptPanel.vue'
import AssetVoicePanel from './AssetVoicePanel.vue'
import type { SettingAsset } from '@/types/settingAsset'

const props = defineProps<{
  asset: SettingAsset
  isSelected: boolean
  isExpanded: boolean
}>()

const emit = defineEmits<{
  (e: 'generate', id: string): void
  (e: 'upload', payload: { id: string; imageUrl: string }): void
  (e: 'select-candidate', payload: { id: string; imageUrl: string }): void
  (e: 'preview', asset: SettingAsset): void
  (e: 'favorite', id: string): void
  (e: 'delete', id: string): void
  (e: 'select', id: string): void
  (e: 'update', payload: { id: string; patch: Partial<SettingAsset> }): void
}>()

const uploadRef = ref<HTMLInputElement | null>(null)
const activePanel = ref<'prompt' | 'voice'>('prompt')
const selectedVoiceId = ref(props.asset.selectedVoiceId ?? props.asset.voiceOptions?.[0]?.id ?? '')
const selectedCandidateIndex = ref(0)

const isCharacter = computed(() => props.asset.type === 'character')
const voiceOptions = computed(() => props.asset.voiceOptions ?? [])
const candidateImages = computed(() => {
  if (props.asset.candidateImages && props.asset.candidateImages.length > 0) {
    return props.asset.candidateImages
  }
  return props.asset.imageUrls
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
    activePanel.value = 'prompt'
    selectedVoiceId.value = props.asset.selectedVoiceId ?? props.asset.voiceOptions?.[0]?.id ?? ''
    selectedCandidateIndex.value = 0
  },
)

watch(selectedVoiceId, (value) => {
  emit('update', {
    id: props.asset.id,
    patch: { selectedVoiceId: value },
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
  selectedCandidateIndex.value = payload.index
  emit('select-candidate', { id: props.asset.id, imageUrl: payload.image })
}
</script>
