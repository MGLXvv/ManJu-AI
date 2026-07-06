<template>
  <aside class="resource-sidebar">
    <div class="resource-sidebar__header">
      <span>文件夹</span>
    </div>

    <div class="resource-sidebar__list">
      <button
        v-for="folder in folders"
        :key="folder.id"
        type="button"
        class="resource-sidebar__item"
        :class="{ 'is-active': folder.id === activeFolderId }"
        @click="$emit('select-folder', folder.id)"
      >
        <span>{{ folder.label }}</span>
        <span>{{ counts[folder.id] ?? 0 }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { ResourceFolder } from '@/types/resource'

defineProps<{
  folders: ResourceFolder[]
  activeFolderId: string
  counts: Record<string, number>
}>()

defineEmits<{
  (e: 'select-folder', id: string): void
}>()
</script>