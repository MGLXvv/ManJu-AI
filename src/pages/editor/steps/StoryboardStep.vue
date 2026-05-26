<template>
  <section class="storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="storyboard-layout" :class="{ 'is-reference-collapsed': isReferenceCollapsed }">
      <div class="storyboard-layout__main">
        <section class="storyboard-main-card">

        <StoryboardTopActions
          class="storyboard-main-card__actions"
          @batch-generate="handleBatchGenerate"
          @save-export="handleSaveExport"
          @next="goVideoStep"
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
        @select="selectShot"
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
import { computed, ref, watchEffect } from 'vue'
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
const currentShot = computed(() => activeShot.value ?? shots.value[0] ?? null)
const currentReferenceImages = computed(() => currentShot.value?.referenceImages ?? referenceImages.value)
const isReferenceCollapsed = ref(false)

watchEffect(() => {
  if (!activeShot.value && shots.value.length > 0) {
    store.selectShot(shots.value[0].id)
  }
})

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
const toggleReferenceRail = (collapsed: boolean): void => {
  isReferenceCollapsed.value = collapsed
}
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
