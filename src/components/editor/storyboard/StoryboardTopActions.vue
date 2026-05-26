<template>
  <div class="storyboard-top-actions">
    <button type="button" class="storyboard-top-actions__model" aria-label="选择模型">
      <span>Gpt 4.0</span>
      <ChevronDown :size="16" />
    </button>

    <div class="storyboard-top-actions__group">
      <button type="button" class="storyboard-top-actions__btn" @click="$emit('batch-generate')">批量生成</button>
      <button type="button" class="storyboard-top-actions__btn" @click="$emit('save-export')">保存并导出</button>
      <button
        type="button"
        class="storyboard-top-actions__btn storyboard-top-actions__btn--primary"
        @click="$emit('next')"
      >
        进入视频生成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

defineEmits<{
  (e: 'batch-generate'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()
</script>
