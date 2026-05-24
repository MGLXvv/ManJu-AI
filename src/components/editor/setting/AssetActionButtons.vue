<template>
  <div class="asset-action-buttons">
    <button type="button" @click="$emit('generate')">生成图片</button>
    <button type="button" @click="$emit('upload')">上传图片</button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'generate'): void
  (e: 'upload'): void
}>()
</script>
