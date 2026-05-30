<template>
  <div class="asset-generating-card">
    <span class="asset-generating-card__spinner" aria-hidden="true">◌</span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: '角色生成中...',
  },
)
</script>
