<template>
  <section class="dubbing-step">
    <div class="dubbing-step__bg" aria-hidden="true"></div>

    <div class="dubbing-workbench">
      <WorkflowStepper />

      <div class="dubbing-toolbar">
        <div class="dubbing-toolbar__filters">
          <button type="button" class="dubbing-toolbar__filter">全部资产（{{ totalCount }}）</button>

          <label class="dubbing-toolbar__search">
            <input v-model="keyword" type="text" placeholder="请输入角色名称" />
            <FigmaIcon name="search" :size="18" />
          </label>
        </div>

        <div class="dubbing-toolbar__actions">
          <button type="button" class="dubbing-toolbar__batch" @click="handleGenerateAll">一键全部配音</button>
          <EditorModelSelect v-model="selectedModelId" :options="modelOptions" />
        </div>
      </div>

      <div class="dubbing-grid-wrap">
        <div class="dubbing-grid">
          <DubbingRoleCard
            v-for="card in pagedCards"
            :key="card.id"
            :id="card.id"
            :title="card.title"
            :image-url="card.imageUrl"
            :selected-voice-id="card.selectedVoiceId"
            :voice-options="card.voiceOptions"
            :lines="card.lines"
            :created-at="card.createdAt"
            @update-voice="updateVoice(card.id, $event)"
            @preview-line="previewLine"
            @generate="generateCard"
            @delete="deleteCard"
          />
        </div>
      </div>

      <div class="dubbing-footer">
        <button type="button" class="dubbing-footer__primary" @click="goCompleteStep">完成并导出剪映</button>

        <div class="dubbing-footer__pager">
          <span class="dubbing-footer__count">共{{ totalCount }}项</span>

          <button type="button" class="dubbing-footer__page-btn" :disabled="currentPage === 1" @click="currentPage -= 1">
            <FigmaIcon name="pager-prev" :size="14" />
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="dubbing-footer__page-number"
            :class="{ 'is-active': page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="dubbing-footer__page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage += 1"
          >
            <FigmaIcon name="pager-next" :size="14" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DubbingRoleCard, { type DubbingRoleLine } from '@/components/editor/dubbing/DubbingRoleCard.vue'
import EditorModelSelect, { type EditorModelOption } from '@/components/editor/common/EditorModelSelect.vue'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { useSettingAssetsStore } from '@/stores/settingAssets'
import type { VoiceOption } from '@/types/settingAsset'

interface DubbingCardViewModel {
  id: string
  title: string
  imageUrl: string
  selectedVoiceId: string
  voiceOptions: VoiceOption[]
  lines: DubbingRoleLine[]
  createdAt: string
}

const router = useRouter()
const route = useRoute()
const assetsStore = useSettingAssetsStore()

const keyword = ref('')
const currentPage = ref(1)
const pageSize = 3
const selectedModelId = ref('index-tts')

const modelOptions: EditorModelOption[] = [
  { id: 'index-tts', name: 'indexTTS', iconName: 'model-openai' },
  { id: 'azure-tts', name: 'Azure TTS', iconName: 'model-openai' },
  { id: 'manju-voice', name: 'ManJu Voice', iconName: 'model-openai' },
]

const dialoguePool = [
  '深夜不知贵人前来所为何事……',
  '臣妾要告诉贵妃娘娘和私通一事。',
  '那年杏花微雨，你说你是果郡王……',
  '今日这局，终究还是要落子了。',
  '若再迟疑，恐怕一切都来不及了。',
]

const baseCharacterAssets = computed(() => assetsStore.assets.filter((asset) => asset.type === 'character'))

const filteredCards = computed<DubbingCardViewModel[]>(() => {
  const word = keyword.value.trim()

  return baseCharacterAssets.value
    .filter((asset) => !word || asset.title.includes(word))
    .map((asset, assetIndex) => ({
      id: asset.id,
      title: asset.title,
      imageUrl: asset.imageUrls[0] ?? '',
      selectedVoiceId: asset.selectedVoiceId ?? asset.voiceOptions?.[0]?.id ?? '',
      voiceOptions: asset.voiceOptions ?? [],
      createdAt: asset.createdAt,
      lines: Array.from({ length: 3 }, (_, lineIndex) => ({
        id: `${asset.id}-line-${lineIndex + 1}`,
        shotLabel: `镜头${assetIndex * 3 + lineIndex + 2}`,
        text: dialoguePool[(assetIndex + lineIndex) % dialoguePool.length],
      })),
    }))
})

const totalCount = computed(() => filteredCards.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const pagedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCards.value.slice(start, start + pageSize)
})

watch([totalCount, currentPage], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  }
})

watch(keyword, () => {
  currentPage.value = 1
})

const updateVoice = (id: string, voiceId: string): void => {
  assetsStore.updateAsset(id, { selectedVoiceId: voiceId })
}

const previewLine = (_lineId: string): void => {}

const generateCard = (_id: string): void => {}

const deleteCard = (id: string): void => {
  assetsStore.deleteAsset(id)
}

const handleGenerateAll = (): void => {}

const goCompleteStep = (): void => {
  router.push({
    name: 'editor-complete',
    params: route.params,
  })
}
</script>
