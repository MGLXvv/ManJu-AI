<template>
  <div class="storyboard-canvas-toolbar">
    <button type="button" aria-label="编辑" @click="$emit('edit')"><FigmaIcon name="tool-edit" :size="36" /></button>
    <button type="button" aria-label="查看" @click="$emit('view')"><FigmaIcon name="tool-view" :size="36" /></button>
    <button type="button" aria-label="锁定" @click="$emit('lock')"><FigmaIcon name="tool-lock" :size="36" /></button>
    <button type="button" aria-label="放大" @click="$emit('zoom')"><FigmaIcon name="tool-zoom" :size="36" /></button>
    <button type="button" aria-label="复制" @click="$emit('copy')"><FigmaIcon name="tool-copy" :size="36" /></button>
    <button type="button" aria-label="删除" @click="$emit('delete')"><FigmaIcon name="tool-delete" :size="36" /></button>
  </div>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'edit'): void
  (e: 'view'): void
  (e: 'lock'): void
  (e: 'zoom'): void
  (e: 'copy'): void
  (e: 'delete'): void
}>()
</script>
