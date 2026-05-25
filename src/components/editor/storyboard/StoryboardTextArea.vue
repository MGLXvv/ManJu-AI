<template>
  <section class="storyboard-text-area">
    <header class="storyboard-text-area__header">{{ title }}</header>
    <textarea
      :value="modelValue"
      class="storyboard-text-area__input"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: '',
  },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
