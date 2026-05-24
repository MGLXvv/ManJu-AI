<template>
  <div class="asset-prompt">
    <div class="asset-prompt__label">
      <span>提示词</span>
      <span v-if="label">{{ label }}</span>
    </div>
    <textarea class="asset-prompt__textarea" :value="modelValue" readonly />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
}>()
</script>
