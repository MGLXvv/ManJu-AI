<template>
  <div class="storyboard-top-actions">
    <EditorModelSelect />

    <div class="storyboard-top-actions__group">
      <div v-if="modeLabel" class="storyboard-top-actions__mode">{{ modeLabel }}</div>
      <div v-if="saveStateLabel" class="storyboard-top-actions__save-state" :class="`is-${saveStateTone}`">
        {{ saveStateLabel }}
      </div>
      <button type="button" class="storyboard-top-actions__btn" @click="$emit('batch-generate')">{{ batchLabel }}</button>
      <button type="button" class="storyboard-top-actions__btn" @click="$emit('save-export')">{{ saveLabel }}</button>
      <button
        type="button"
        class="storyboard-top-actions__btn storyboard-top-actions__btn--primary"
        @click="$emit('next')"
      >
        {{ nextLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import EditorModelSelect from '@/components/editor/common/EditorModelSelect.vue'

withDefaults(
  defineProps<{
    batchLabel?: string
    saveLabel?: string
    nextLabel?: string
    modeLabel?: string
    saveStateLabel?: string
    saveStateTone?: 'saving' | 'dirty' | 'saved'
  }>(),
  {
    batchLabel: '批量操作',
    saveLabel: '保存并导出',
    nextLabel: '进入视频生成',
    modeLabel: '',
    saveStateLabel: '',
    saveStateTone: 'saved',
  },
)

defineEmits<{
  (e: 'batch-generate'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()
</script>
