<template>
  <div ref="rootRef" class="script-model-select-wrap">
    <button
      class="script-model-select"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="menuOpen"
      @click="toggleMenu"
    >
      <img v-if="selectedModel.iconUrl" class="script-model-select__icon-img" :src="selectedModel.iconUrl" :alt="selectedModel.name" />
      <FigmaIcon v-else class="script-model-select__icon-fallback" :name="selectedModel.iconName" :size="20" />
      <span class="script-model-select__label">{{ selectedModel.name }}</span>
      <span class="script-model-select__arrow">▾</span>
    </button>

    <div v-if="menuOpen" class="script-model-menu" role="listbox" aria-label="选择模型">
      <button
        v-for="model in modelOptions"
        :key="model.id"
        type="button"
        class="script-model-menu__item"
        :class="{ 'is-active': model.id === selectedModel.id }"
        @click="selectModel(model.id)"
      >
        <img v-if="model.iconUrl" class="script-model-menu__icon-img" :src="model.iconUrl" :alt="model.name" />
        <FigmaIcon v-else class="script-model-menu__icon-fallback" :name="model.iconName" :size="20" />
        <span>{{ model.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'

export interface EditorModelOption {
  id: string
  name: string
  iconUrl?: string
  iconName: FigmaIconName
}

const DEFAULT_OPTIONS: EditorModelOption[] = [
  {
    id: 'gpt-4.0',
    name: 'Gpt 4.0',
    iconName: 'model-openai',
  },
]

const props = defineProps<{
  modelValue?: string
  options?: EditorModelOption[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const innerModelId = ref(props.modelValue || props.options?.[0]?.id || DEFAULT_OPTIONS[0].id)

const modelOptions = computed<EditorModelOption[]>(() =>
  props.options && props.options.length > 0 ? props.options : DEFAULT_OPTIONS,
)

const selectedModelId = computed(() => props.modelValue || innerModelId.value)

const selectedModel = computed(() => {
  return modelOptions.value.find((option) => option.id === selectedModelId.value) ?? modelOptions.value[0]
})

const toggleMenu = (): void => {
  menuOpen.value = !menuOpen.value
}

const selectModel = (modelId: string): void => {
  innerModelId.value = modelId
  emit('update:modelValue', modelId)
  menuOpen.value = false
}

const closeOnOutside = (event: MouseEvent): void => {
  const target = event.target as Node | null
  if (!target || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(target)) {
    menuOpen.value = false
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      innerModelId.value = value
    }
  },
)

onMounted(() => {
  document.addEventListener('mousedown', closeOnOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeOnOutside)
})
</script>
