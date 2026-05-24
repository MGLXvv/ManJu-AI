<template>
  <div class="asset-voice-select" ref="rootRef">
    <button class="asset-voice-select__trigger" type="button" @click="open = !open">
      <span>{{ selectedLabel }}</span>
      <ChevronDown :size="14" class="asset-voice-select__arrow" />
    </button>

    <div v-if="open" class="asset-voice-select__menu">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        class="asset-voice-select__option"
        :class="{ 'is-selected': option.id === modelValue }"
        @click="select(option.id)"
      >
        <span>{{ option.name }}</span>
        <small v-if="option.duration">{{ option.duration }}</small>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { VoiceOption } from '@/types/settingAsset'

const props = defineProps<{
  modelValue: string
  options: VoiceOption[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const selectedLabel = computed(() => {
  return props.options.find((item) => item.id === props.modelValue)?.name ?? '请选择音色'
})

const select = (id: string): void => {
  emit('update:modelValue', id)
  open.value = false
}

const handleDocumentClick = (event: MouseEvent): void => {
  const target = event.target as Node | null
  if (!target || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
