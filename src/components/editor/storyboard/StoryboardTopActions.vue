<template>
  <div class="storyboard-top-actions">
    <EditorModelSelect />

    <div class="storyboard-top-actions__group">
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
  }>(),
  {
    batchLabel: '批量操作',
    saveLabel: '保存并导出',
    nextLabel: '进入视频生成',
  },
)

defineEmits<{
  (e: 'batch-generate'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()
</script>
