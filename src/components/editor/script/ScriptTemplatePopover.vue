<template>
  <div class="script-template-popover">
    <div v-if="mode === 'list'" class="script-template-popover__list">
      <div
        v-for="template in templates"
        :key="template.id"
        class="script-template-popover__item"
        :class="{ 'is-active': template.id === selectedTemplateId }"
        @click="$emit('apply-template', template.id)"
        @keydown.enter.prevent="$emit('apply-template', template.id)"
        @keydown.space.prevent="$emit('apply-template', template.id)"
        tabindex="0"
        role="button"
      >
        <div class="script-template-popover__item-main">
          <span class="script-template-popover__item-name">{{ template.name }}</span>
          <span class="script-template-popover__item-content">{{ template.content }}</span>
        </div>

        <div class="script-template-popover__item-actions">
          <button
            class="script-template-popover__item-edit"
            type="button"
            @click.stop="$emit('start-edit', template.id)"
          >
            修改
          </button>

          <button
            class="script-template-popover__item-delete"
            type="button"
            @click.stop="$emit('request-delete', template.id)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="!templates.length" class="script-template-popover__empty">暂无模板，先新增一条模板内容。</div>
    </div>

    <div v-else class="script-template-popover__editor">
      <label class="script-template-popover__field">
        <span class="script-template-popover__label">模板名称</span>
        <input
          :value="formName"
          class="script-template-popover__input"
          :class="{ 'has-error': Boolean(errors.name) }"
          type="text"
          maxlength="24"
          placeholder="请输入模板名称"
          @input="$emit('update:form-name', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="errors.name" class="script-template-popover__error">{{ errors.name }}</span>
      </label>

      <label class="script-template-popover__field">
        <span class="script-template-popover__label">模板内容</span>
        <textarea
          :value="formContent"
          class="script-template-popover__textarea"
          :class="{ 'has-error': Boolean(errors.content) }"
          placeholder="请输入要保存的提示词模板内容"
          @input="$emit('update:form-content', ($event.target as HTMLTextAreaElement).value)"
        />
        <span v-if="errors.content" class="script-template-popover__error">{{ errors.content }}</span>
      </label>
    </div>

    <footer class="script-template-popover__footer">
      <template v-if="mode === 'list'">
        <button class="script-template-popover__footer-btn is-primary" type="button" @click="$emit('start-create')">
          添加模板
        </button>
      </template>
      <template v-else>
        <button class="script-template-popover__footer-btn is-ghost" type="button" @click="$emit('cancel-edit')">
          返回列表
        </button>
        <button
          class="script-template-popover__footer-btn is-primary"
          type="button"
          :disabled="saving"
          @click="$emit('save-template')"
        >
          {{ saving ? '保存中' : '保存模板' }}
        </button>
      </template>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { ScriptTemplateFormErrors } from '@/features/editor/scriptTemplateState'
import type { ScriptTemplate } from '@/types/scriptTemplate'

withDefaults(
  defineProps<{
    templates: ScriptTemplate[]
    selectedTemplateId: string | null
    mode: 'list' | 'create' | 'edit'
    formName: string
    formContent: string
    errors: ScriptTemplateFormErrors
    saving?: boolean
  }>(),
  {
    saving: false,
  },
)

defineEmits<{
  (event: 'apply-template', templateId: string): void
  (event: 'start-create'): void
  (event: 'start-edit', templateId: string): void
  (event: 'request-delete', templateId: string): void
  (event: 'cancel-edit'): void
  (event: 'save-template'): void
  (event: 'update:form-name', value: string): void
  (event: 'update:form-content', value: string): void
}>()
</script>
