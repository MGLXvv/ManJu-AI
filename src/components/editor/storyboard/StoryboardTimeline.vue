<template>
  <section class="storyboard-timeline" :class="{ 'is-collapsed': collapsed }">
    <button type="button" class="storyboard-timeline__nav" aria-label="向左滚动" @click="scrollTrack(-280)">
      <span class="storyboard-timeline__nav-frame" aria-hidden="true"></span>
      <span class="storyboard-timeline__nav-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.75 3.5L5.25 7L8.75 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <div ref="trackRef" class="storyboard-timeline__track">
      <template v-for="(shot, index) in shots" :key="shot.id">
        <div
          class="storyboard-timeline__slot"
          :class="{
            'is-drag-over': dragOverShotId === shot.id,
            'is-batch-mode': batchMode,
            'has-insert-card': !batchMode && mode === 'multi-param' && insertAfterShotId === shot.id,
          }"
          @dragover.prevent="handleDragOver(shot.id)"
          @drop="handleDrop(shot.id)"
        >
          <StoryboardShotCard
            :shot="shot"
            :active="shot.id === activeShotId"
            :batch-mode="batchMode"
            :batch-selected="batchSelectedIds.includes(shot.id)"
            :draggable="!batchMode"
            :dragging="draggingShotId === shot.id"
            @select="$emit('select', $event)"
            @upload="$emit('upload', $event)"
            @copy="$emit('copy', $event)"
            @delete="$emit('delete', $event)"
            @favorite="$emit('favorite', $event)"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
          />

          <InsertStoryboardShotCard
            v-if="!batchMode && mode === 'multi-param' && insertAfterShotId === shot.id"
            @insert="$emit('insert-after', shot.id)"
          />

          <div
            v-if="index < shots.length - 1 || (index === shots.length - 1 && !batchMode)"
            class="storyboard-timeline__link"
            aria-hidden="true"
          >
            <span class="storyboard-timeline__link-line"></span>
            <span class="storyboard-timeline__link-plus">
              <svg width="10" height="50" viewBox="0 0 10 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="10" height="50" rx="5" fill="#323232" />
                <rect x="1" y="24.4277" width="8" height="1.14286" rx="0.571429" fill="white" />
                <rect
                  x="5.57147"
                  y="21"
                  width="8"
                  height="1.14286"
                  rx="0.571429"
                  transform="rotate(90 5.57147 21)"
                  fill="white"
                />
              </svg>
            </span>
            <span class="storyboard-timeline__link-line"></span>
          </div>
        </div>

        <CreateBlankShotCard v-if="index === shots.length - 1 && !batchMode" @create="$emit('create')" />
      </template>
    </div>

    <button type="button" class="storyboard-timeline__nav" aria-label="向右滚动" @click="scrollTrack(280)">
      <span class="storyboard-timeline__nav-frame" aria-hidden="true"></span>
      <span class="storyboard-timeline__nav-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <button
      type="button"
      class="storyboard-timeline__collapse-handle"
      :aria-label="collapsed ? '展开底部分镜列表' : '收起底部分镜列表'"
      @click="$emit('toggle-collapse')"
    >
      <span aria-hidden="true"></span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CreateBlankShotCard from './CreateBlankShotCard.vue'
import InsertStoryboardShotCard from './InsertStoryboardShotCard.vue'
import StoryboardShotCard from './StoryboardShotCard.vue'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { StoryboardShot } from '@/types/storyboard'

withDefaults(
  defineProps<{
    shots: StoryboardShot[]
    activeShotId: string
    mode?: StoryboardMode
    insertAfterShotId?: string | null
    batchMode?: boolean
    batchSelectedIds?: string[]
    collapsed?: boolean
  }>(),
  {
    mode: null,
    insertAfterShotId: null,
    batchMode: false,
    batchSelectedIds: () => [],
    collapsed: false,
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'upload', id: string): void
  (e: 'copy', id: string): void
  (e: 'delete', id: string): void
  (e: 'favorite', id: string): void
  (e: 'reorder', payload: { draggedId: string; targetId: string }): void
  (e: 'insert-after', id: string): void
  (e: 'create'): void
  (e: 'toggle-collapse'): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const draggingShotId = ref<string | null>(null)
const dragOverShotId = ref<string | null>(null)

const scrollTrack = (delta: number): void => {
  trackRef.value?.scrollBy({
    left: delta,
    behavior: 'smooth',
  })
}

const handleDragStart = (id: string, event: DragEvent): void => {
  draggingShotId.value = id
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragOver = (id: string): void => {
  if (!draggingShotId.value || draggingShotId.value === id) {
    dragOverShotId.value = null
    return
  }

  dragOverShotId.value = id
}

const handleDrop = (targetId: string): void => {
  if (!draggingShotId.value || draggingShotId.value === targetId) {
    handleDragEnd()
    return
  }

  emit('reorder', {
    draggedId: draggingShotId.value,
    targetId,
  })
  handleDragEnd()
}

const handleDragEnd = (): void => {
  draggingShotId.value = null
  dragOverShotId.value = null
}
</script>