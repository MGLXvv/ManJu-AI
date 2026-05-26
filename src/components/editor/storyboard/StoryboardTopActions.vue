<template>
  <div class="storyboard-top-actions">
    <button type="button" class="storyboard-top-actions__model" aria-label="选择模型">
      <span>{{ modelLabel }}</span>
      <ChevronDown :size="16" />
    </button>

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
import { ChevronDown } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    modelLabel?: string
    batchLabel?: string
    saveLabel?: string
    nextLabel?: string
  }>(),
  {
    modelLabel: 'Gpt 4.0',
    batchLabel: '批量生成',
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
