<template>
  <section class="script-prompt-block">
    <h2 class="script-column-title">编辑提示词</h2>

    <div class="script-prompt-card">
      <textarea
        v-model="model"
        class="script-prompt-card__textarea"
        placeholder="请输入生成剧本时的要求，例如字数、风格、剧情重点、角色表现等"
      />

      <footer class="script-prompt-card__actions">
        <div class="script-prompt-card__actions-left">
          <button class="script-action-pill script-action-pill--danger" type="button" @click="$emit('delete')">
            <FigmaIcon name="asset-delete" :size="12" />
            <span>删除</span>
          </button>

          <button class="script-action-pill" type="button" @click="$emit('save')">
            <FigmaIcon name="asset-copy" :size="12" />
            <span>保存</span>
          </button>

          <button class="script-action-pill" type="button" @click="$emit('open-template')">
            <FigmaIcon name="asset-edit" :size="12" />
            <span>模板</span>
          </button>
        </div>

        <div class="script-prompt-card__actions-right">
          <button
            class="script-generate-outline"
            type="button"
            :disabled="!canGenerate || loading"
            @click="$emit('generate')"
          >
            生成剧本
          </button>

          <button
            class="script-generate-outline"
            type="button"
            :disabled="!canGenerate || loading"
            @click="$emit('generate')"
          >
            生成剧本
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineProps<{
  canGenerate: boolean
  loading?: boolean
}>()

defineEmits<{
  (e: 'delete'): void
  (e: 'save'): void
  (e: 'open-template'): void
  (e: 'generate'): void
}>()

const model = defineModel<string>({ required: true })
</script>
