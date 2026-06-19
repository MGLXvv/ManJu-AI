<template>
  <Teleport to="body">
    <Transition name="storyboard-image-dialog">
      <div v-if="open" class="storyboard-image-dialog__mask" @click="emit('close')">
        <section class="storyboard-edit-dialog" role="dialog" aria-modal="true" @click.stop>
          <header class="storyboard-edit-dialog__header">
            <div>
              <h3>编辑分镜图</h3>
              <p>框选需要修改的区域，输入编辑提示词后应用新的编辑结果。</p>
            </div>
            <button type="button" class="storyboard-edit-dialog__close" aria-label="关闭" @click="emit('close')">×</button>
          </header>

          <div class="storyboard-edit-dialog__body">
            <div
              ref="stageRef"
              class="storyboard-edit-dialog__stage"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointerleave="handlePointerUp"
            >
              <img :src="imageUrl" :alt="title" draggable="false" @dragstart.prevent />
              <div class="storyboard-edit-dialog__overlay"></div>
              <div class="storyboard-edit-dialog__selection" :style="selectionStyle"></div>
            </div>

            <aside class="storyboard-edit-dialog__sidebar">
              <div class="storyboard-edit-dialog__meta">
                <span class="storyboard-edit-dialog__label">当前镜头</span>
                <strong>{{ title }}</strong>
              </div>

              <div class="storyboard-edit-dialog__meta">
                <span class="storyboard-edit-dialog__label">框选区域</span>
                <strong>{{ Math.round(selection.width) }}% × {{ Math.round(selection.height) }}%</strong>
              </div>

              <label class="storyboard-edit-dialog__field">
                <span>编辑提示词</span>
                <textarea
                  v-model="promptText"
                  :disabled="loading"
                  placeholder="例如：强化主角面部情绪，补一点背光和空气透视"
                ></textarea>
              </label>

              <div class="storyboard-edit-dialog__tips">
                <span>建议聚焦局部画面调整，例如表情、光影或局部细节强化。</span>
              </div>

              <div class="storyboard-edit-dialog__actions">
                <button type="button" class="is-secondary" :disabled="loading" @click="resetSelection">重置框选</button>
                <button type="button" class="is-secondary" :disabled="loading" @click="emit('close')">取消</button>
                <button type="button" class="is-primary" :disabled="loading || !canSubmit" @click="submitEdit">
                  {{ loading ? '生成中' : '应用编辑' }}
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { clampStoryboardSelection, type StoryboardSelectionRect } from '@/features/editor/storyboardPreviewState'

const props = withDefaults(
  defineProps<{
    open: boolean
    imageUrl: string
    title: string
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'apply', payload: { prompt: string; selection: StoryboardSelectionRect }): void
}>()

const stageRef = ref<HTMLElement | null>(null)
const promptText = ref('')
const selection = ref<StoryboardSelectionRect>({ x: 18, y: 18, width: 34, height: 28 })
const dragging = ref(false)
const dragStart = ref<{ x: number; y: number } | null>(null)

const resetDialogState = (): void => {
  promptText.value = ''
  selection.value = { x: 18, y: 18, width: 34, height: 28 }
  dragging.value = false
  dragStart.value = null
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetDialogState()
    }
  },
)

const selectionStyle = computed(() => ({
  left: `${selection.value.x}%`,
  top: `${selection.value.y}%`,
  width: `${selection.value.width}%`,
  height: `${selection.value.height}%`,
}))

const canSubmit = computed(() => {
  return promptText.value.trim().length > 0 && selection.value.width >= 2 && selection.value.height >= 2
})

const resolvePoint = (event: PointerEvent): { x: number; y: number } | null => {
  const stage = stageRef.value
  if (!stage) {
    return null
  }

  const bounds = stage.getBoundingClientRect()
  if (!bounds.width || !bounds.height) {
    return null
  }

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * 100,
    y: ((event.clientY - bounds.top) / bounds.height) * 100,
  }
}

const handlePointerDown = (event: PointerEvent): void => {
  if (props.loading) {
    return
  }

  event.preventDefault()

  const point = resolvePoint(event)
  if (!point) {
    return
  }

  stageRef.value?.setPointerCapture?.(event.pointerId)

  dragging.value = true
  dragStart.value = point
  selection.value = clampStoryboardSelection({
    x: point.x,
    y: point.y,
    width: 0,
    height: 0,
  })
}

const handlePointerMove = (event: PointerEvent): void => {
  if (!dragging.value || !dragStart.value) {
    return
  }

  const point = resolvePoint(event)
  if (!point) {
    return
  }

  selection.value = clampStoryboardSelection({
    x: dragStart.value.x,
    y: dragStart.value.y,
    width: point.x - dragStart.value.x,
    height: point.y - dragStart.value.y,
  })
}

const handlePointerUp = (event?: PointerEvent): void => {
  if (event && stageRef.value?.hasPointerCapture?.(event.pointerId)) {
    stageRef.value.releasePointerCapture(event.pointerId)
  }
  dragging.value = false
  dragStart.value = null
}

const resetSelection = (): void => {
  selection.value = { x: 18, y: 18, width: 34, height: 28 }
}

const submitEdit = (): void => {
  if (!canSubmit.value) {
    return
  }

  emit('apply', {
    prompt: promptText.value.trim(),
    selection: selection.value,
  })
}
</script>
