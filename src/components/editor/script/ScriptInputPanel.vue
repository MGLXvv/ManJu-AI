<template>
  <section class="script-panel script-input-panel">
    <header class="script-panel__header">
      <h2 class="script-panel__title">文案输入</h2>
      <button class="script-panel__ghost-btn" type="button" @click="triggerImport">文档</button>
      <input ref="fileInputRef" class="script-input-panel__file-input" type="file" accept=".txt,.md,.text" @change="onFileChange" />
    </header>

    <div class="script-input-panel__body">
      <ScriptEmptyGuide
        v-if="showGuide"
        @manual-edit="manualMode = true"
        @select-template="onSelectTemplate"
      />

      <textarea
        v-else
        ref="textareaRef"
        v-model="model"
        class="script-input-panel__textarea"
        placeholder="请输入你的创意、故事梗概或完整文案"
      />
    </div>

    <footer class="script-input-panel__footer">
      <button
        v-if="manualMode && !model.trim()"
        type="button"
        class="script-input-panel__footer-link"
        @click="manualMode = false"
      >
        返回引导
      </button>
      <span>共{{ model.length }}个字</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ScriptEmptyGuide from './ScriptEmptyGuide.vue'

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
