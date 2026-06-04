<template>
  <aside class="system-sidebar">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="system-sidebar__item"
      :class="{ 'is-active': modelValue === item.key }"
      @click="$emit('update:modelValue', item.key)"
    >
      <span class="system-sidebar__icon">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import type { SystemPanelKey } from '@/types/system'

defineProps<{
  modelValue: SystemPanelKey
}>()

defineEmits<{
  (e: 'update:modelValue', value: SystemPanelKey): void
}>()

const items: Array<{ key: SystemPanelKey; label: string; icon: string }> = [
  { key: 'styles', label: '风格管理', icon: '◧' },
  { key: 'permissions', label: '权限管理', icon: '◔' },
  { key: 'messages', label: '消息通知', icon: '◉' },
]
</script>
