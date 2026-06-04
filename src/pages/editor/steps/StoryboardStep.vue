<template>
  <section class="storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="storyboard-layout" :class="{ 'is-reference-collapsed': isReferenceCollapsed }">
      <div class="storyboard-layout__main">
        <section class="storyboard-main-card" :class="{ 'has-batch-toolbar': batchMode }">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            :batch-label="batchMode ? '退出批量' : '批量操作'"
            @batch-generate="handleBatchTrigger"
            @save-export="handleSaveExport"
            @next="goVideoStep"
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

          <div class="storyboard-main-card__body">
            <StoryboardPromptPanel
              v-if="currentShot"
              :shot="currentShot"
              :tag-options="tagOptions"
              :style-options="styleOptions"
              @add-tag="handleAddTag"
              @remove-tag="handleRemoveTag"
              @update-prompt="updatePrompt"
              @update-style="updateStyle"
              @update-ratio="updateRatio"
              @generate-shot="generateShot"
            />

            <StoryboardPreviewPanel
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

      <StoryboardReferenceRail
        class="storyboard-layout__reference"
        :images="currentReferenceImages"
        :collapsed="isReferenceCollapsed"
        @select="selectReference"
        @toggle-collapse="toggleReferenceRail"
      />

      <StoryboardTimeline
        class="storyboard-layout__timeline"
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
import StoryboardPreviewPanel from '@/components/editor/storyboard/StoryboardPreviewPanel.vue'
import StoryboardPromptPanel from '@/components/editor/storyboard/StoryboardPromptPanel.vue'
import StoryboardReferenceRail from '@/components/editor/storyboard/StoryboardReferenceRail.vue'
import StoryboardTimeline from '@/components/editor/storyboard/StoryboardTimeline.vue'
import StoryboardTopActions from '@/components/editor/storyboard/StoryboardTopActions.vue'
import { useStoryboardStore } from '@/stores/storyboard'
import type { StoryboardTagType } from '@/types/storyboard'

const store = useStoryboardStore()
const router = useRouter()
const route = useRoute()

const shots = computed(() => store.shots)
const activeShotId = computed(() => store.activeShotId)
const activeShot = computed(() => store.activeShot)
const referenceImages = computed(() => store.referenceImages)
const tagOptions = computed(() => store.tagOptions)
const styleOptions = computed(() => store.styleOptions)
const currentShot = computed(() => activeShot.value ?? shots.value[0] ?? null)
const currentReferenceImages = computed(() => currentShot.value?.referenceImages ?? referenceImages.value)
const isReferenceCollapsed = ref(false)
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

const handleAddTag = (type: StoryboardTagType, tagId: string): void => {
  const source =
    type === 'character'
      ? tagOptions.value.characters
      : type === 'scene'
        ? tagOptions.value.scenes
        : tagOptions.value.props
  const target = source.find((item) => item.id === tagId)
  if (!target) return
  store.addTagToActiveShot(type, target)
}

const handleRemoveTag = (type: StoryboardTagType, tagId: string): void => {
  store.removeTagFromActiveShot(type, tagId)
}

const updatePrompt = (value: string): void => {
  store.updateActiveShotPrompt(value)
}

const updateStyle = (value: string): void => {
  store.updateActiveShotStyle(value)
}

const updateRatio = (value: '16:9' | '9:16'): void => {
  store.updateActiveShotRatio(value)
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

const selectReference = (_id: string): void => {}

const toggleReferenceRail = (collapsed: boolean): void => {
  isReferenceCollapsed.value = collapsed
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

const goVideoStep = (): void => {
  router.push({
    name: 'editor-video',
    params: route.params,
  })
}
</script>
