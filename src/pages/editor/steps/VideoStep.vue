<template>
  <section class="video-step storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="video-layout">
      <div class="video-layout__main">
        <section class="storyboard-main-card video-main-card" :class="{ 'has-batch-toolbar': batchMode }">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            next-label="进入配音"
            :batch-label="batchMode ? '退出批量' : '批量操作'"
            @batch-generate="handleBatchTrigger"
            @save-export="handleSaveExport"
            @next="goDubbingStep"
          />

          <BatchSelectionToolbar
            v-if="batchMode"
            action-label="批量生成"
            primary-label="全选分镜"
            :selected-count="selectedShotIds.length"
            :total-count="shots.length"
            :primary-selected="isAllShotsSelected"
            :action-disabled="selectedShotIds.length === 0"
            @exit="exitBatchMode"
            @toggle-primary="toggleSelectAllShots"
            @action="handleBatchGenerate"
          />

          <div class="storyboard-main-card__divider"></div>

          <div class="storyboard-main-card__body video-main-card__body">
            <VideoPromptPanel v-if="currentShot" :shot="currentShot" @generate-video="generateShot" />

            <VideoPreviewPanel
              v-if="currentShot"
              :shot="currentShot"
              @lock-shot="toggleLock"
              @copy-shot="copyShot"
              @delete-shot="deleteShot"
              @edit-shot="noop"
              @view-shot="noop"
              @zoom-shot="noop"
            />
          </div>
        </section>
      </div>

      <StoryboardTimeline
        class="video-layout__timeline"
        :shots="shots"
        :active-shot-id="activeShotId"
        :batch-mode="batchMode"
        :batch-selected-ids="selectedShotIds"
        @select="handleTimelineSelect"
        @upload="noop"
        @copy="copyShot"
        @delete="deleteShot"
        @favorite="toggleFavorite"
        @create="createBlankShot"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import StoryboardTimeline from '@/components/editor/storyboard/StoryboardTimeline.vue'
import StoryboardTopActions from '@/components/editor/storyboard/StoryboardTopActions.vue'
import VideoPreviewPanel from '@/components/editor/video/VideoPreviewPanel.vue'
import VideoPromptPanel from '@/components/editor/video/VideoPromptPanel.vue'
import { useStoryboardStore } from '@/stores/storyboard'

const store = useStoryboardStore()
const router = useRouter()
const route = useRoute()

const shots = computed(() => store.shots)
const activeShotId = computed(() => store.activeShotId)
const activeShot = computed(() => store.activeShot)
const currentShot = computed(() => activeShot.value ?? shots.value[0] ?? null)
const batchMode = ref(false)
const selectedShotIds = ref<string[]>([])
const isAllShotsSelected = computed(
  () => shots.value.length > 0 && shots.value.every((shot) => selectedShotIds.value.includes(shot.id)),
)

watch(
  shots,
  (value) => {
    if (!activeShot.value && value.length > 0) {
      store.selectShot(value[0].id)
    }

    selectedShotIds.value = selectedShotIds.value.filter((id) => value.some((shot) => shot.id === id))
  },
  { immediate: true },
)

const selectShot = (id: string): void => {
  store.selectShot(id)
}

const handleTimelineSelect = (id: string): void => {
  if (batchMode.value) {
    selectedShotIds.value = selectedShotIds.value.includes(id)
      ? selectedShotIds.value.filter((item) => item !== id)
      : [...selectedShotIds.value, id]
    return
  }

  selectShot(id)
}

const generateShot = (): void => {
  void store.generateActiveShot()
}

const createBlankShot = (): void => {
  store.createBlankShot()
}

const copyShot = (id: string): void => {
  store.copyShot(id)
}

const deleteShot = (id: string): void => {
  store.deleteShot(id)
}

const toggleFavorite = (id: string): void => {
  store.toggleFavorite(id)
}

const toggleLock = (id: string): void => {
  store.toggleLock(id)
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedShotIds.value = []
}

const toggleSelectAllShots = (): void => {
  selectedShotIds.value = isAllShotsSelected.value ? [] : shots.value.map((shot) => shot.id)
}

const handleBatchTrigger = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }

  batchMode.value = true
}

const handleBatchGenerate = async (): Promise<void> => {
  if (selectedShotIds.value.length === 0) return

  for (const id of selectedShotIds.value) {
    await store.generateShotById(id)
  }
}

const handleSaveExport = (): void => {}
const noop = (_id?: string): void => {}

const goDubbingStep = (): void => {
  router.push({
    name: 'editor-dubbing',
    params: route.params,
  })
}
</script>
