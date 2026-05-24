<template>
  <div class="asset-prompt-panel">
    <textarea
      class="asset-prompt-panel__textarea"
      :value="modelValue"
      placeholder="请输入提示词"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>
