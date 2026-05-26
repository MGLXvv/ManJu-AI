<template>
  <section class="video-step storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="video-layout">
      <div class="video-layout__main">
        <section class="storyboard-main-card video-main-card">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            next-label="进入配音"
            @batch-generate="handleBatchGenerate"
            @save-export="handleSaveExport"
            @next="goDubbingStep"
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
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

watchEffect(() => {
  if (!activeShot.value && shots.value.length > 0) {
    store.selectShot(shots.value[0].id)
  }
})

const selectShot = (id: string): void => {
  store.selectShot(id)
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

const handleBatchGenerate = (): void => {}
const handleSaveExport = (): void => {}
const noop = (_id?: string): void => {}

const goDubbingStep = (): void => {
  router.push({
    name: 'editor-dubbing',
    params: route.params,
  })
}
</script>
