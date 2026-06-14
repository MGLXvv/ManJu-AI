<template>
  <section class="storyboard-text-area">
    <header class="storyboard-text-area__header">{{ title }}</header>
    <div class="storyboard-text-area__body">
      <textarea
        :value="modelValue"
        class="storyboard-text-area__input"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />

      <button
        v-if="showOptimize"
        type="button"
        class="storyboard-text-area__optimize"
        aria-label="AI优化"
        title="AI优化"
        :disabled="disabled || loading || !modelValue.trim()"
        @click="$emit('optimize')"
      >
        <FigmaIcon name="result-ai-optimize" :size="20" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

withDefaults(
  defineProps<{
    title: string
    modelValue: string
    placeholder?: string
    disabled?: boolean
    showOptimize?: boolean
    loading?: boolean
  }>(),
  {
    placeholder: '',
    disabled: false,
    showOptimize: false,
    loading: false,
  },
)

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'optimize'): void
}>()
</script>
