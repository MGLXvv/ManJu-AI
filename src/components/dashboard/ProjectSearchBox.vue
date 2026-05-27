<template>
  <label class="project-search-box">
    <input
      :value="modelValue"
      class="project-search-box__input"
      placeholder="搜索名称"
      @input="onInput"
    />
    <FigmaIcon class="project-search-box__icon" name="search" :size="18" />
  </label>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event): void => {
  const target = event.target as HTMLInputElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>
