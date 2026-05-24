<template>
  <button
    class="script-template-btn"
    :class="{ 'is-active': active }"
    type="button"
    @click="$emit('click')"
  >
    <span class="script-template-btn__title">{{ title }}</span>
    <span class="script-template-btn__desc">{{ desc }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  desc: string
  active?: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()
</script>
