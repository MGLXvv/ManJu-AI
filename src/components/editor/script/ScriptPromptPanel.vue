<template>
  <section class="script-prompt-block">
    <h2 class="script-column-title">{{ titleText }}</h2>

    <div class="script-prompt-card">
      <textarea
        v-model="model"
        class="script-prompt-card__textarea"
        :disabled="disabled"
        :placeholder="placeholderText"
      />

      <footer class="script-prompt-card__actions">
        <div class="script-prompt-card__actions-left">
          <button class="script-action-pill" type="button" :disabled="disabled" @click="$emit('delete')">
            <FigmaIcon name="action-delete" :size="18" />
            <span>删除</span>
          </button>

          <button class="script-action-pill" type="button" :disabled="disabled" @click="$emit('save')">
            <FigmaIcon name="action-save" :size="18" />
            <span>{{ actionState === 'saving' ? '保存中' : '保存' }}</span>
          </button>

          <button
            class="script-action-pill"
            type="button"
            data-script-template-trigger="true"
            :disabled="disabled"
            @click="$emit('open-template')"
          >
            <FigmaIcon name="action-template" :size="18" />
            <span>模板</span>
          </button>
        </div>

        <div class="script-prompt-card__actions-right">
          <span v-if="statusText" class="script-prompt-card__status">{{ statusText }}</span>
          <button
            class="script-generate-outline"
            type="button"
            :disabled="!canGenerate || disabled"
            @click="$emit('generate')"
          >
            {{ actionState === 'generating' ? loadingText : actionState === 'optimizing' ? '优化中' : generateButtonText }}
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

const props = withDefaults(
  defineProps<{
    canGenerate: boolean
    disabled?: boolean
    statusText?: string
    actionState?: 'idle' | 'saving' | 'generating' | 'optimizing'
    title?: string
    placeholder?: string
    generateText?: string
    generatingText?: string
  }>(),
  {
    title: '编辑提示词',
    placeholder: '请输入生成剧本时的要求，例如字数、风格、剧情重点、角色表现等',
    generateText: '生成剧本',
    generatingText: '生成中',
  },
)

defineEmits<{
  (e: 'delete'): void
  (e: 'save'): void
  (e: 'open-template'): void
  (e: 'generate'): void
}>()

const model = defineModel<string>({ required: true })
const titleText = computed(() => props.title)
const placeholderText = computed(() => props.placeholder)
const generateButtonText = computed(() => props.generateText)
const loadingText = computed(() => props.generatingText)
</script>
