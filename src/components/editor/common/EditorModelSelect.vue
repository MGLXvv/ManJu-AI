<template>
  <div ref="rootRef" class="editor-model-select-wrap">
    <button
      class="editor-model-select"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="menuOpen"
      @click="toggleMenu"
    >
      <img
        v-if="selectedModel.iconUrl"
        class="editor-model-select__icon-img"
        :src="selectedModel.iconUrl"
        :alt="selectedModel.name"
      />
      <FigmaIcon
        v-else
        class="editor-model-select__icon-fallback"
        :name="selectedModel.iconName"
        :size="20"
      />
      <span class="editor-model-select__label">{{ selectedModel.name }}</span>
      <span class="editor-model-select__arrow">⌄</span>
    </button>

    <div v-if="menuOpen" class="editor-model-menu" role="listbox" aria-label="选择模型">
      <button
        v-for="model in modelOptions"
        :key="model.id"
        type="button"
        class="editor-model-menu__item"
        :class="{ 'is-active': model.id === selectedModel.id }"
        @click="selectModel(model.id)"
      >
        <img
          v-if="model.iconUrl"
          class="editor-model-menu__icon-img"
          :src="model.iconUrl"
          :alt="model.name"
        />
        <FigmaIcon
          v-else
          class="editor-model-menu__icon-fallback"
          :name="model.iconName"
          :size="20"
        />
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

<style scoped>
.editor-model-select-wrap {
  position: relative;
  display: inline-flex;
}

.editor-model-select {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 12px;
  align-items: center;
  justify-content: start;
  column-gap: 8px;
  height: 36px;
  min-width: 152px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #3d3f3f;
  color: #d8d8d8;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
}

.editor-model-select__icon-img,
.editor-model-select__icon-fallback {
  width: 20px;
  height: 20px;
}

.editor-model-select__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.editor-model-select__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
}

.editor-model-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  min-width: 186px;
  padding: 6px;
  border: 1px solid #4a4b4c;
  border-radius: 10px;
  background: #2f3031;
  box-shadow: 0 8px 20px rgb(0 0 0 / 35%);
}

.editor-model-menu__item {
  width: 100%;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #d8d8d8;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.editor-model-menu__item:hover,
.editor-model-menu__item.is-active {
  background: #3b3c3d;
}

.editor-model-menu__icon-img,
.editor-model-menu__icon-fallback {
  width: 20px;
  height: 20px;
}

@media (max-width: 960px) {
  .editor-model-select {
    min-width: 0;
    width: 100%;
    flex: 1;
  }
}
</style>
