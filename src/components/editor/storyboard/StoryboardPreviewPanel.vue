<template>
  <section class="storyboard-preview-panel">
    <div
      class="storyboard-canvas"
      :class="{ 'is-generating': isGenerating, 'is-hidden': Boolean(shot.isHidden), 'is-locked': Boolean(shot.isLocked) }"
    >
      <div class="storyboard-canvas__stage">
        <template v-if="isMultiParamMode">
          <div class="storyboard-canvas__empty is-multi-param">
            <strong>多参模式，无图片生成</strong>
            <span>当前镜头仅维护参数配置，不生成单张预览图</span>
          </div>
        </template>
        <template v-else-if="isGenerating">
          <div class="storyboard-canvas__loading">
            <div class="storyboard-canvas__loading-line">
              <span class="storyboard-canvas__loading-hourglass">⌛</span>
              <strong>镜头生成中...</strong>
            </div>
            <span class="storyboard-canvas__loading-bar" aria-hidden="true">
              <span></span>
            </span>
          </div>
        </template>
        <template v-else-if="shot.imageUrl">
          <img class="storyboard-canvas__image" :src="shot.imageUrl" :alt="shot.title" />
          <div class="storyboard-canvas__badges">
            <span v-if="shot.isHidden" class="storyboard-canvas__badge is-hidden">已隐藏</span>
            <span v-if="shot.isLocked" class="storyboard-canvas__badge is-locked">已锁定</span>
          </div>
        </template>
        <template v-else>
          <div class="storyboard-canvas__empty">当前镜头暂无预览图</div>
        </template>
      </div>
    </div>

    <StoryboardCanvasToolbar
      :is-hidden="Boolean(shot.isHidden)"
      :is-locked="Boolean(shot.isLocked)"
      :tool-states="toolStates"
      @edit="$emit('edit-shot', shot.id)"
      @view="$emit('view-shot', shot.id)"
      @toggle-hidden="$emit('toggle-hidden-shot', shot.id)"
      @lock="$emit('lock-shot', shot.id)"
      @zoom="$emit('zoom-shot', shot.id)"
      @copy="$emit('copy-shot', shot.id)"
      @delete="$emit('delete-shot', shot.id)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StoryboardCanvasToolbar from './StoryboardCanvasToolbar.vue'
import {
  resolveStoryboardToolAvailability,
  type StoryboardMode,
  type StoryboardToolAction,
} from '@/features/editor/storyboardModeState'
import type { StoryboardShot } from '@/types/storyboard'

const props = defineProps<{
  shot: StoryboardShot
  mode: StoryboardMode
}>()

defineEmits<{
  (e: 'edit-shot', id: string): void
  (e: 'view-shot', id: string): void
  (e: 'toggle-hidden-shot', id: string): void
  (e: 'lock-shot', id: string): void
  (e: 'zoom-shot', id: string): void
  (e: 'copy-shot', id: string): void
  (e: 'delete-shot', id: string): void
}>()

const isGenerating = computed(() => props.shot.status === 'generating')
const isMultiParamMode = computed(() => props.mode === 'multi-param')

const toolStates = computed(() =>
  (
    ['edit', 'view', 'toggle-hidden', 'lock', 'zoom', 'copy', 'delete'] as StoryboardToolAction[]
  ).reduce<Record<StoryboardToolAction, ReturnType<typeof resolveStoryboardToolAvailability>>>((result, action) => {
    result[action] = resolveStoryboardToolAvailability({
      mode: props.mode,
      action,
      isLocked: Boolean(props.shot.isLocked),
    })
    return result
  }, {} as Record<StoryboardToolAction, ReturnType<typeof resolveStoryboardToolAvailability>>),
)
</script>
