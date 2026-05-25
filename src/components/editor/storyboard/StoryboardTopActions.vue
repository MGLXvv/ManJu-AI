<template>
  <div class="storyboard-top-actions">
    <button type="button" class="storyboard-top-actions__btn" @click="$emit('batch-generate')">批量生成</button>
    <button type="button" class="storyboard-top-actions__btn" @click="$emit('save-export')">保存并导出</button>
    <button type="button" class="storyboard-top-actions__btn storyboard-top-actions__btn--primary" @click="$emit('next')">
      进入视频生成
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'batch-generate'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()
</script>
