<template>
  <div class="storyboard-canvas-toolbar">
    <button type="button" aria-label="编辑" @click="$emit('edit')"><Pencil :size="16" /></button>
    <button type="button" aria-label="查看" @click="$emit('view')"><Eye :size="16" /></button>
    <button type="button" aria-label="锁定" @click="$emit('lock')"><Lock :size="16" /></button>
    <button type="button" aria-label="放大" @click="$emit('zoom')"><Search :size="16" /></button>
    <button type="button" aria-label="复制" @click="$emit('copy')"><Copy :size="16" /></button>
    <button type="button" aria-label="删除" @click="$emit('delete')"><Trash2 :size="16" /></button>
  </div>
</template>

<script setup lang="ts">
import { Copy, Eye, Lock, Pencil, Search, Trash2 } from 'lucide-vue-next'

defineEmits<{
  (e: 'edit'): void
  (e: 'view'): void
  (e: 'lock'): void
  (e: 'zoom'): void
  (e: 'copy'): void
  (e: 'delete'): void
}>()
</script>
