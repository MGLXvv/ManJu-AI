<template>
  <section class="script-step">
    <div class="script-workbench-bg" aria-hidden="true"></div>

    <div class="script-workbench-card">
      <header class="script-workbench-card__topbar">
        <EditorModelSelect v-model="selectedModelId" />

        <div class="script-workbench-card__topbar-right">
          <span class="script-workbench-card__save-state" :class="{ 'is-dirty': isDirty }">
            {{ actionState === 'saving' ? '保存中' : isDirty ? '未保存' : '已保存' }}
          </span>

          <button class="script-next-btn" type="button" :disabled="!canEnterNext || submitting" @click="handleNext">
            进入设定
          </button>
        </div>
      </header>

      <div class="script-workbench-card__divider"></div>

      <div class="script-workbench-card__body">
        <ScriptInputPanel
          v-model="sourceText"
          :disabled="isBusy"
          @import-text="handleImportText"
          @import-error="handleScriptImportError"
        />

        <div class="script-workbench-card__right">
          <div
            ref="promptWrapRef"
            class="script-workbench-card__prompt-wrap"
            :class="{ 'is-template-open': templatePanelOpen }"
          >
            <ScriptPromptPanel
              v-model="promptText"
              :disabled="isBusy"
              :status-text="statusText"
              :action-state="actionState"
              :can-generate="canGenerate"
              @save="handleSave"
              @open-template="handleOpenTemplate"
              @delete="handleDelete"
              @generate="handleGenerate"
            />

            <ScriptTemplatePopover
              v-if="templatePanelOpen"
              ref="templatePopoverRef"
              :style="templatePopoverStyle"
              :templates="scriptTemplateStore.templates"
              :selected-template-id="selectedTemplateId"
              :mode="templatePanelMode"
              :form-name="templateForm.name"
              :form-content="templateForm.content"
              :errors="templateFormErrors"
              :saving="templateSubmitting"
              @apply-template="handleApplyTemplate"
              @start-create="handleStartCreateTemplate"
              @start-edit="handleStartEditTemplate"
              @request-delete="handleRequestDeleteTemplate"
              @cancel-edit="handleCancelTemplateEdit"
              @save-template="handleSaveTemplate"
              @update:form-name="handleTemplateNameChange"
              @update:form-content="handleTemplateContentChange"
            />
          </div>

          <div class="script-workbench-card__dash-line"></div>

          <ScriptResultPanel
            v-model="generatedScript"
            :loading="generating"
            :disabled="isBusy"
            :placeholder-text="resultPlaceholderText"
            :show-optimize="false"
          />
        </div>
      </div>
    </div>

    <AppConfirmDialog
      :open="leaveConfirmOpen"
      :title="leaveDialogCopy.title"
      :description="leaveDialogCopy.description"
      :confirm-text="leaveDialogCopy.confirmText"
      :cancel-text="leaveDialogCopy.cancelText"
      confirm-tone="primary"
      @confirm="confirmLeave"
      @cancel="cancelLeaveConfirm"
    />

    <AppConfirmDialog
      :open="templateDiscardConfirmOpen"
      title="确定放弃模板编辑？"
      description="当前模板内容尚未保存，关闭后本次编辑会丢失。"
      confirm-text="确认放弃"
      cancel-text="继续编辑"
      confirm-tone="danger"
      @confirm="confirmDiscardTemplateChanges"
      @cancel="cancelDiscardTemplateChanges"
    />

    <AppConfirmDialog
      :open="templateDeleteConfirmOpen"
      title="确定删除当前模板？"
      description="删除后该模板将无法继续在提示词区直接复用。"
      confirm-text="确认删除"
      cancel-text="取消"
      confirm-tone="danger"
      @confirm="confirmDeleteTemplate"
      @cancel="cancelDeleteTemplate"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import EditorModelSelect from '@/components/editor/common/EditorModelSelect.vue'
import ScriptInputPanel from '@/components/editor/script/ScriptInputPanel.vue'
import ScriptPromptPanel from '@/components/editor/script/ScriptPromptPanel.vue'
import ScriptResultPanel from '@/components/editor/script/ScriptResultPanel.vue'
import ScriptTemplatePopover from '@/components/editor/script/ScriptTemplatePopover.vue'
import { buildScriptDraftSnapshot, clearScriptPromptFields, hasUnsavedScriptChanges } from '@/features/editor/scriptDraftState'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildScriptLeaveDialogCopy, shouldInterceptScriptLeave } from '@/features/editor/scriptLeaveConfirmState'
import {
  buildScriptTemplateInput,
  createEmptyScriptTemplateInput,
  hasScriptTemplateInputChanges,
  validateScriptTemplateInput,
  type ScriptTemplateFormErrors,
} from '@/features/editor/scriptTemplateState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useScriptTemplateStore } from '@/stores/scriptTemplates'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import { scriptGenerationService } from '@/services/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { ScriptTemplateInput } from '@/types/scriptTemplate'

const router = useRouter()
const route = useRoute()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()
const scriptTemplateStore = useScriptTemplateStore()

const DEFAULT_PROMPT = '请将输入故事整理为适合漫画短剧制作的三幕结构，保留核心冲突、角色转折和后续可拆分的镜头线索。'

const sourceText = ref('')
const promptText = ref(DEFAULT_PROMPT)
const generatedScript = ref('')
const generating = ref(false)
const submitting = ref(false)
const selectedModelId = ref('gpt-4.0')
const leaveConfirmOpen = ref(false)
const templatePanelOpen = ref(false)
const templatePanelMode = ref<'list' | 'create' | 'edit'>('list')
const templateSubmitting = ref(false)
const promptWrapRef = ref<HTMLElement | null>(null)
const templatePopoverRef = ref<HTMLElement | { $el?: HTMLElement } | null>(null)
const templatePopoverStyle = ref<Record<string, string>>({})
const templateDiscardConfirmOpen = ref(false)
const templateDiscardAction = ref<'close' | 'back-to-list'>('close')
const templateDeleteConfirmOpen = ref(false)
const selectedTemplateId = ref<string | null>(null)
const editingTemplateId = ref<string | null>(null)
const pendingDeleteTemplateId = ref<string | null>(null)
const templateForm = ref<ScriptTemplateInput>(createEmptyScriptTemplateInput())
const templateInitialForm = ref<ScriptTemplateInput>(createEmptyScriptTemplateInput())
const templateFormErrors = ref<ScriptTemplateFormErrors>({})
const lastSavedSnapshot = ref(buildScriptDraftSnapshot({ sourceText: '', promptText: DEFAULT_PROMPT, generatedScript: '' }))
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const bypassLeaveGuard = ref(false)

const projectId = computed(() => String(route.params.projectId ?? ''))
const canGenerate = computed(() => Boolean(sourceText.value.trim()))
const canEnterNext = computed(() => Boolean(generatedScript.value.trim()))
const isBusy = computed(() => generating.value || submitting.value)
const actionState = computed<'idle' | 'saving' | 'generating'>(() => {
  if (submitting.value) return 'saving'
  if (generating.value) return 'generating'
  return 'idle'
})
const statusText = computed(() => {
  switch (actionState.value) {
    case 'saving':
      return '正在保存当前文案内容'
    case 'generating':
      return '正在根据原始文案生成剧本'
    default:
      return isDirty.value ? '当前内容有修改，建议先保存' : '当前内容已同步到草稿'
  }
})
const resultPlaceholderText = computed(() => '正在生成剧本...')
const currentSnapshot = computed(() =>
  buildScriptDraftSnapshot({
    sourceText: sourceText.value,
    promptText: promptText.value,
    generatedScript: generatedScript.value,
  }),
)
const isDirty = computed(() =>
  hasUnsavedScriptChanges(lastSavedSnapshot.value, {
    sourceText: sourceText.value,
    promptText: promptText.value,
    generatedScript: generatedScript.value,
  }),
)
const leaveDialogCopy = buildScriptLeaveDialogCopy()
const templateFormDirty = computed(() =>
  hasScriptTemplateInputChanges(templateInitialForm.value, templateForm.value),
)

const updateTemplatePopoverPosition = (): void => {
  const wrapEl = promptWrapRef.value
  const popoverEl = (templatePopoverRef.value &&
    '$el' in templatePopoverRef.value &&
    templatePopoverRef.value.$el
    ? templatePopoverRef.value.$el
    : templatePopoverRef.value) as HTMLElement | null
  const promptCardEl = wrapEl?.querySelector<HTMLElement>('.script-prompt-card')

  if (!wrapEl || !popoverEl || !promptCardEl) {
    return
  }

  const wrapRect = wrapEl.getBoundingClientRect()
  const promptCardRect = promptCardEl.getBoundingClientRect()
  const width = promptCardRect.width
  const left = promptCardRect.left - wrapRect.left
  const top = promptCardRect.bottom - wrapRect.top - 9

  templatePopoverStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  }
}

const handleGlobalPointerDown = (event: PointerEvent): void => {
  if (!templatePanelOpen.value) {
    return
  }

  const target = event.target as Node | null
  if (!target) {
    return
  }

  if (promptWrapRef.value?.contains(target)) {
    return
  }

  handleRequestCloseTemplatePanel()
}

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      return
    }

    await editorStore.loadDraft(nextProjectId)
    sourceText.value = editorStore.draft?.script.content ?? ''
    promptText.value = editorStore.draft?.script.prompt || DEFAULT_PROMPT
    generatedScript.value = editorStore.draft?.script.generated ?? ''
    lastSavedSnapshot.value = buildScriptDraftSnapshot({
      sourceText: sourceText.value,
      promptText: promptText.value,
      generatedScript: generatedScript.value,
    })
  },
  { immediate: true },
)

watch(sourceText, (content) => {
  editorStore.updateScriptContent(content)
})

watch(promptText, (prompt) => {
  editorStore.updateScriptPrompt(prompt)
})

watch(generatedScript, (generated) => {
  editorStore.updateGeneratedScript(generated)
})

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const resolveEditorError = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : ''

  switch (message) {
    case API_ERROR_CODES.editorSaveFailed:
      return '保存失败，请检查内容后重试'
    case 'SCRIPT_GENERATE_FAILED':
      return '剧本生成失败，请调整文案或提示词后重试'
    default:
      return fallback
  }
}

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const syncScriptDraftToStore = (): void => {
  editorStore.updateScriptContent(sourceText.value)
  editorStore.updateScriptPrompt(promptText.value)
  editorStore.updateGeneratedScript(generatedScript.value)
}

const persistDraft = async (): Promise<boolean> => {
  syncScriptDraftToStore()

  submitting.value = true
  try {
    await editorStore.saveDraft()
    markSaved()
    return true
  } catch (error) {
    showToast(resolveEditorError(error, '保存失败，请稍后再试'), 'error')
    return false
  } finally {
    submitting.value = false
  }
}

const cancelLeaveConfirm = (): void => {
  leaveConfirmOpen.value = false
  pendingLeaveTarget.value = null
}

const confirmLeave = async (): Promise<void> => {
  const nextTarget = pendingLeaveTarget.value
  leaveConfirmOpen.value = false
  pendingLeaveTarget.value = null

  if (!nextTarget) {
    return
  }

  bypassLeaveGuard.value = true
  await router.push(nextTarget)
}

const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (!isDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  scriptTemplateStore.ensureLoaded()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
})

onBeforeRouteLeave((to) => {
  if (!shouldInterceptScriptLeave(isDirty.value, bypassLeaveGuard.value)) {
    if (bypassLeaveGuard.value) {
      bypassLeaveGuard.value = false
    }
    return true
  }

  pendingLeaveTarget.value = to.fullPath
  leaveConfirmOpen.value = true
  return false
})

const handleImportText = (text: string): void => {
  sourceText.value = text
}

const handleScriptImportError = (message: string): void => {
  showToast(message, 'error')
}

const handleSave = async (): Promise<void> => {
  const saved = await persistDraft()
  if (saved) {
    showToast('文案内容已保存', 'success')
  }
}

const handleOpenTemplate = (): void => {
  if (!templatePanelOpen.value) {
    scriptTemplateStore.ensureLoaded()
  }

  templatePanelMode.value = 'list'
  templateFormErrors.value = {}
  templatePanelOpen.value = !templatePanelOpen.value

  if (templatePanelOpen.value) {
    void nextTick(updateTemplatePopoverPosition)
  }
}

const handleDelete = async (): Promise<void> => {
  const nextFields = clearScriptPromptFields({
    sourceText: sourceText.value,
    promptText: promptText.value,
    generatedScript: generatedScript.value,
  })
  sourceText.value = nextFields.sourceText
  promptText.value = nextFields.promptText
  generatedScript.value = nextFields.generatedScript
  const saved = await persistDraft()
  if (saved) {
    showToast('提示词内容已清空', 'success')
  }
}

const handleGenerate = async (): Promise<void> => {
  if (!canGenerate.value || generating.value) {
    return
  }

  generating.value = true
  try {
    const result = await scriptGenerationService.generateScript({
      projectId: projectId.value,
      sourceText: sourceText.value,
      promptText: promptText.value,
      modelId: selectedModelId.value,
    })
    generatedScript.value = result.script
    const saved = await persistDraft()
    if (saved) {
      showToast('剧本生成完成', 'success')
    }
  } catch (error) {
    showToast(resolveEditorError(error, '剧本生成失败，请稍后再试'), 'error')
  } finally {
    generating.value = false
  }
}


const handleNext = async (): Promise<void> => {
  const validation = validateEditorAdvance('scriptToSettings', { generatedScript: generatedScript.value })
  if (!validation.ok) {
    showToast(validation.message, 'error')
    return
  }

  const saved = await persistDraft()
  if (!saved) {
    return
  }

  if (projectId.value) {
    await projectStore.updateProjectStep(projectId.value, validation.nextStep)
  }

  showToast(validation.successMessage, 'success')
  bypassLeaveGuard.value = true

  await router.push({
    name: validation.routeName,
    params: route.params,
  })
}

const resetTemplateEditor = (): void => {
  templatePanelMode.value = 'list'
  editingTemplateId.value = null
  templateForm.value = createEmptyScriptTemplateInput()
  templateInitialForm.value = createEmptyScriptTemplateInput()
  templateFormErrors.value = {}
}

const handleApplyTemplate = (templateId: string): void => {
  const template = scriptTemplateStore.templates.find((item) => item.id === templateId)
  if (!template) {
    return
  }

  selectedTemplateId.value = template.id
  promptText.value = template.content
  templatePanelOpen.value = false
  resetTemplateEditor()
  showToast(`已应用模板：${template.name}`, 'success')
}

const handleStartCreateTemplate = (): void => {
  templatePanelMode.value = 'create'
  editingTemplateId.value = null
  templateForm.value = createEmptyScriptTemplateInput()
  templateInitialForm.value = createEmptyScriptTemplateInput()
  templateFormErrors.value = {}
  void nextTick(updateTemplatePopoverPosition)
}

const handleStartEditTemplate = (templateId: string): void => {
  const template = scriptTemplateStore.templates.find((item) => item.id === templateId)
  if (!template) {
    showToast('未找到要修改的模板', 'error')
    return
  }

  selectedTemplateId.value = template.id
  editingTemplateId.value = template.id
  templatePanelMode.value = 'edit'
  templateForm.value = buildScriptTemplateInput(template)
  templateInitialForm.value = buildScriptTemplateInput(template)
  templateFormErrors.value = {}
  void nextTick(updateTemplatePopoverPosition)
}

const handleCancelTemplateEdit = (): void => {
  if (templateFormDirty.value) {
    templateDiscardAction.value = 'back-to-list'
    templateDiscardConfirmOpen.value = true
    return
  }

  resetTemplateEditor()
}

const handleRequestCloseTemplatePanel = (): void => {
  if (templatePanelMode.value !== 'list' && templateFormDirty.value) {
    templateDiscardAction.value = 'close'
    templateDiscardConfirmOpen.value = true
    return
  }

  templatePanelOpen.value = false
  templatePopoverStyle.value = {}
  resetTemplateEditor()
}

const handleTemplateNameChange = (value: string): void => {
  templateForm.value = {
    ...templateForm.value,
    name: value,
  }
  templateFormErrors.value = {
    ...templateFormErrors.value,
    name: undefined,
  }
}

const handleTemplateContentChange = (value: string): void => {
  templateForm.value = {
    ...templateForm.value,
    content: value,
  }
  templateFormErrors.value = {
    ...templateFormErrors.value,
    content: undefined,
  }
}

const cancelDiscardTemplateChanges = (): void => {
  templateDiscardConfirmOpen.value = false
}

const handleRequestDeleteTemplate = (templateId: string): void => {
  pendingDeleteTemplateId.value = templateId
  templateDeleteConfirmOpen.value = true
}

const cancelDeleteTemplate = (): void => {
  templateDeleteConfirmOpen.value = false
  pendingDeleteTemplateId.value = null
}

const confirmDeleteTemplate = async (): Promise<void> => {
  const templateId = pendingDeleteTemplateId.value
  if (!templateId) {
    return
  }

  templateSubmitting.value = true
  try {
    await scriptTemplateStore.deleteTemplate(templateId)
    if (selectedTemplateId.value === templateId) {
      selectedTemplateId.value = null
    }
    if (editingTemplateId.value === templateId) {
      resetTemplateEditor()
    }
    showToast('提示词模板已删除', 'success')
  } catch {
    showToast('模板删除失败，请稍后再试', 'error')
  } finally {
    templateSubmitting.value = false
    templateDeleteConfirmOpen.value = false
    pendingDeleteTemplateId.value = null
  }
}

const confirmDiscardTemplateChanges = (): void => {
  templateDiscardConfirmOpen.value = false
  if (templateDiscardAction.value === 'close') {
    templatePanelOpen.value = false
    templatePopoverStyle.value = {}
  }
  resetTemplateEditor()
}

const handleSaveTemplate = async (): Promise<void> => {
  const validation = validateScriptTemplateInput(
    scriptTemplateStore.templates,
    templateForm.value,
    editingTemplateId.value,
  )

  if (!validation.ok) {
    templateFormErrors.value = validation.errors
    return
  }

  templateSubmitting.value = true
  try {
    if (templatePanelMode.value === 'create') {
      const created = await scriptTemplateStore.createTemplate(validation.value)
      selectedTemplateId.value = created.id
      showToast('提示词模板已添加', 'success')
    } else if (editingTemplateId.value) {
      const updated = await scriptTemplateStore.updateTemplate(editingTemplateId.value, validation.value)
      selectedTemplateId.value = updated.id
      showToast('提示词模板已更新', 'success')
    }

    templatePanelOpen.value = false
    resetTemplateEditor()
  } catch {
    showToast('模板保存失败，请稍后再试', 'error')
  } finally {
    templateSubmitting.value = false
  }
}
</script>
