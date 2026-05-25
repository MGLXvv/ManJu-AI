<template>
  <section class="storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <StoryboardTopActions @batch-generate="handleBatchGenerate" @save-export="handleSaveExport" @next="goVideoStep" />

    <div class="storyboard-step__body">
      <div class="storyboard-step__main">
        <StoryboardPromptPanel
          v-if="activeShot"
          :shot="activeShot"
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
          v-if="activeShot"
          :shot="activeShot"
          @lock-shot="toggleLock"
          @copy-shot="copyShot"
          @delete-shot="deleteShot"
          @edit-shot="noop"
          @view-shot="noop"
          @zoom-shot="noop"
        />
      </div>

      <StoryboardReferenceRail :images="referenceImages" @select="selectReference" />
    </div>

    <StoryboardTimeline
      :shots="shots"
      :active-shot-id="activeShotId"
      @select="selectShot"
      @upload="noop"
      @copy="copyShot"
      @delete="deleteShot"
      @favorite="toggleFavorite"
      @create="createBlankShot"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const selectShot = (id: string): void => {
  store.selectShot(id)
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
const handleBatchGenerate = (): void => {}
const handleSaveExport = (): void => {}
const noop = (_id?: string): void => {}

const goVideoStep = (): void => {
  router.push({
    name: 'editor-video',
    params: route.params,
  })
}
</script>
