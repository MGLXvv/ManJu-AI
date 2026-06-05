<template>
  <section class="script-input-panel">
    <h2 class="script-column-title">文案输入</h2>

    <div class="script-input-panel__card">
      <button class="script-doc-btn" type="button" :disabled="disabled" @click="triggerImport">
        <FigmaIcon class="script-doc-btn__icon" name="action-doc-link" :size="20" />
        <span>文档</span>
      </button>

      <input
        ref="fileInputRef"
        class="script-input-panel__file-input"
        type="file"
        accept=".txt,.md,.text"
        :disabled="disabled"
        @change="onFileChange"
      />

      <div class="script-input-panel__body">
        <ScriptEmptyGuide v-if="showGuide" @select-template="onSelectTemplate" />

        <textarea
          v-else
          ref="textareaRef"
          v-model="model"
          class="script-input-panel__textarea"
          :disabled="disabled"
          placeholder="请输入你的创意、故事梗概或完整文案"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import ScriptEmptyGuide from './ScriptEmptyGuide.vue'

defineProps<{
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })

const emit = defineEmits<{
  (e: 'import-text', text: string): void
}>()

const manualMode = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const showGuide = computed(() => !model.value.trim() && !manualMode.value)

const onSelectTemplate = async (text: string): Promise<void> => {
  model.value = text
  manualMode.value = true
  await nextTick()
  textareaRef.value?.focus()
}

const triggerImport = (): void => {
  fileInputRef.value?.click()
}

const onFileChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  const text = await file.text()
  model.value = text
  manualMode.value = true
  emit('import-text', text)

  if (target) {
    target.value = ''
  }

  await nextTick()
  textareaRef.value?.focus()
}
</script>
