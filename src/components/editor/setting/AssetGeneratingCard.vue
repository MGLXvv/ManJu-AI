<template>
  <div class="asset-generating-card">
    <Loader2 class="asset-generating-card__spinner" :size="18" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: '角色生成中...',
  },
)
</script>
