<template>
  <AppIcon :name="name" :size="size" :title="title" />
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { AppIconName } from './iconRegistry'

withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
    title?: string
  }>(),
  {
    size: 20,
    title: '',
  },
)
</script>
