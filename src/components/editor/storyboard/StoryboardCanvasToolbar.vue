<template>
  <div class="storyboard-canvas-toolbar">
    <button type="button" aria-label="缂栬緫" @click="$emit('edit')"><FigmaIcon name="tool-edit" :size="36" /></button>
    <button type="button" aria-label="鏌ョ湅" @click="$emit('view')"><FigmaIcon name="tool-view" :size="36" /></button>
    <button type="button" aria-label="閿佸畾" @click="$emit('lock')"><FigmaIcon name="tool-lock" :size="36" /></button>
    <button type="button" aria-label="鏀惧ぇ" @click="$emit('zoom')"><FigmaIcon name="tool-zoom" :size="36" /></button>
    <button type="button" aria-label="澶嶅埗" @click="$emit('copy')"><FigmaIcon name="tool-copy" :size="36" /></button>
    <button type="button" aria-label="鍒犻櫎" @click="$emit('delete')"><FigmaIcon name="tool-delete" :size="36" /></button>
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

