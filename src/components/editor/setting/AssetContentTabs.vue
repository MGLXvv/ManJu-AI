<template>
  <div class="asset-content-tabs">
    <button
      type="button"
      class="asset-content-tabs__item"
      :class="{ 'is-active': modelValue === 'prompt' }"
      @click="$emit('update:modelValue', 'prompt')"
    >
      提示词
    </button>

    <button
      type="button"
      class="asset-content-tabs__item"
      :class="{ 'is-active': modelValue === 'voice' }"
      @click="$emit('update:modelValue', 'voice')"
    >
      角色音色
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: 'prompt' | 'voice'
}>()

defineEmits<{
  (e: 'update:modelValue', value: 'prompt' | 'voice'): void
}>()
</script>
