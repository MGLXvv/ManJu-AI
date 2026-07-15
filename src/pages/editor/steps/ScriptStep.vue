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
          <button
            v-if="currentStage === 'storyboard'"
            class="script-secondary-btn"
            type="button"
            :disabled="submitting || !storyboardText.trim()"
            @click="exportStoryboardArtifact"
          >
            保存并导出
          </button>
          <button
            v-if="previousStage"
            class="script-secondary-btn"
            type="button"
            :disabled="submitting"
            @click="handleBack"
          >
            返回上一步
          </button>
          <button class="script-next-btn" type="button" :disabled="!canEnterNext || submitting" @click="handleNext">
            {{ nextButtonText }}
          </button>
        </div>
      </header>
      <div class="script-workbench-card__divider"></div>
      <div class="script-workbench-card__body">
        <ScriptInputPanel
          v-model="displayedSourceModel"
          :title="stageInputTitle"
          :placeholder="stageInputPlaceholder"
          :show-import-button="showImportButton"
          :use-empty-guide="useEmptyGuide"
          :import-button-text="inputImportButtonText"
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
              :title="promptTitle"
              :placeholder="promptPlaceholder"
              :generate-text="promptGenerateText"
              :generating-text="promptGeneratingText"
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
            v-model="displayedResultModel"
            :title="resultTitle"
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

    <Teleport to="body">
      <Transition name="app-confirm-dialog-fade">
        <div v-if="templateNameDialogOpen" class="script-template-name-dialog__mask" @click="cancelTemplateNameDialog">
          <section class="script-template-name-dialog" role="dialog" aria-modal="true" @click.stop>
            <h3 class="script-template-name-dialog__title">保存提示词模板</h3>
            <p class="script-template-name-dialog__desc">请输入模板名称，保存当前提示词。</p>
            <input
              v-model="templateNameValue"
              class="script-template-name-dialog__input"
              type="text"
              maxlength="24"
              placeholder="请输入模板名称"
            />
            <p v-if="templateNameError" class="script-template-name-dialog__error">{{ templateNameError }}</p>
            <div class="script-template-name-dialog__actions">
              <button
                class="script-template-name-dialog__btn is-neutral"
                type="button"
                @click="cancelTemplateNameDialog"
              >
                取消
              </button>
              <button
                class="script-template-name-dialog__btn is-primary"
                type="button"
                :disabled="templateSubmitting"
                @click="confirmTemplateNameDialog"
              >
                {{ templateSubmitting ? '保存中' : '保存模板' }}
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
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
import { resolveCapability } from '@/features/capabilities/capabilityRegistry'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import {
  buildScriptDraftSnapshot,
  clearScriptPromptFields,
  hasUnsavedScriptChanges,
} from '@/features/editor/scriptDraftState'
import { resolveEditorActionErrorMessage } from '@/features/editor/generationErrorMessageState'
import { buildScriptLeaveDialogCopy, shouldInterceptScriptLeave } from '@/features/editor/scriptLeaveConfirmState'
import { createLatestRequestGuard } from '@/features/shared/latestRequestState'
import {
  buildScriptTemplateInput,
  createEmptyScriptTemplateInput,
  hasScriptTemplateInputChanges,
  validateScriptTemplateInput,
  type ScriptTemplateFormErrors,
} from '@/features/editor/scriptTemplateState'
import { scriptGenerationWorkflowService } from '@/services/editor/scriptGenerationWorkflow.service'
import { scriptWorkflowService } from '@/services/editor/scriptWorkflow.service'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useScriptTemplateStore } from '@/stores/scriptTemplates'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import { EDITOR_SAVE_STATES } from '@/types/api-enums'
import type { ScriptTemplateInput } from '@/types/scriptTemplate'

type ScriptStageRouteName = 'editor-script-input' | 'editor-script-storyboard'
type ScriptStageKey = 'input' | 'storyboard'

const router = useRouter()
const route = useRoute()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()
const scriptTemplateStore = useScriptTemplateStore()
const generatedScriptWriteCapability = resolveCapability('editor.script.generated.write')

const DEFAULT_PROMPT = '请将输入内容整理为适合漫画短剧制作的剧本，突出情绪推进、画面感、旁白与字幕节奏。'

const sourceText = ref('')
const outlineText = ref('')
const promptText = ref(DEFAULT_PROMPT)
const generatedScript = ref('')
const storyboardText = ref('')
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
const templateNameDialogOpen = ref(false)
const templateNameValue = ref('')
const templateNameError = ref('')
const pendingTemplateContent = ref('')
const lastSavedSnapshot = ref(
  buildScriptDraftSnapshot({
    sourceText: '',
    promptText: DEFAULT_PROMPT,
    outlineText: '',
    generatedScript: '',
    storyboardText: '',
  }),
)
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const bypassLeaveGuard = ref(false)
const generationRequestGuard = createLatestRequestGuard()

const STAGE_ROUTES: Record<ScriptStageKey, ScriptStageRouteName> = {
  input: 'editor-script-input',
  storyboard: 'editor-script-storyboard',
}
const STAGE_ORDER: ScriptStageKey[] = ['input', 'storyboard']

const projectId = computed(() => String(route.params.projectId ?? ''))
const stageRouteName = computed(() => (route.name as ScriptStageRouteName | undefined) ?? 'editor-script-input')
const currentStage = computed<ScriptStageKey>(() =>
  stageRouteName.value === 'editor-script-storyboard' ? 'storyboard' : 'input',
)
const currentStageIndex = computed(() => STAGE_ORDER.indexOf(currentStage.value))
const previousStage = computed<ScriptStageKey | null>(() =>
  currentStageIndex.value > 0 ? STAGE_ORDER[currentStageIndex.value - 1] : null,
)

const canGenerate = computed(
  () =>
    generatedScriptWriteCapability.available &&
    (currentStage.value === 'input' ? Boolean(sourceText.value.trim()) : Boolean(generatedScript.value.trim())),
)
const canEnterNext = computed(() =>
  currentStage.value === 'input' ? Boolean(generatedScript.value.trim()) : Boolean(storyboardText.value.trim()),
)
const isBusy = computed(() => generating.value || submitting.value)
const actionState = computed<'idle' | 'saving' | 'generating'>(() => {
  if (submitting.value) return 'saving'
  if (generating.value) return 'generating'
  return 'idle'
})

const stageInputTitle = computed(() => (currentStage.value === 'input' ? '文案输入' : '剧本'))
const stageInputPlaceholder = computed(() =>
  currentStage.value === 'input'
    ? '请输入故事创意、剧情梗概或完整文案内容'
    : '请编辑剧本内容，确认后再继续生成分镜文案',
)
const showImportButton = computed(() => currentStage.value === 'input')
const useEmptyGuide = computed(() => currentStage.value === 'input')
const inputImportButtonText = computed(() => '导入TXT文档')
const promptTitle = computed(() => '编辑提示词')
const promptPlaceholder = computed(() =>
  currentStage.value === 'input'
    ? '请输入剧本生成要求，例如题材、节奏、角色关系和字幕风格'
    : '请输入分镜拆解要求，例如镜头数量、景别、机位和画面细节',
)
const promptGenerateText = computed(() => (currentStage.value === 'input' ? '生成剧本' : '分镜'))
const promptGeneratingText = computed(() => (currentStage.value === 'input' ? '生成剧本中' : '分镜中'))
const resultTitle = computed(() => (currentStage.value === 'input' ? '剧本生成' : '剧本分镜'))
const resultPlaceholderText = computed(() =>
  currentStage.value === 'input' ? '正在根据文案生成剧本...' : '正在根据剧本生成分镜...',
)
const nextButtonText = computed(() => (currentStage.value === 'input' ? '进入分镜' : '进入设定'))
const statusText = computed(() => {
  if (actionState.value === 'saving') return '正在保存当前内容'
  if (actionState.value === 'generating') {
    return currentStage.value === 'input' ? '正在根据文案生成剧本' : '正在根据剧本生成分镜文案'
  }
  if (editorStore.localSaveStatus === 'error') {
    return '浏览器本地保存失败，请复制当前内容后重试'
  }
  if (editorStore.hasUnsavedChanges && editorStore.localSaveStatus === 'saved') {
    return editorStore.saveState === EDITOR_SAVE_STATES.error || editorStore.saveState === EDITOR_SAVE_STATES.conflict
      ? '已保存到当前浏览器，服务器同步失败，可稍后重试'
      : '已保存到当前浏览器，正在等待服务器同步'
  }
  if (!generatedScriptWriteCapability.available) {
    return `${generatedScriptWriteCapability.message}；编辑内容仍会自动保存在当前浏览器`
  }
  if (isDirty.value) return '当前内容有修改，建议先保存'
  return currentStage.value === 'input' ? '输入文案后直接生成剧本' : '生成分镜后可保存并导出 JSON'
})

const currentSnapshot = computed(() =>
  buildScriptDraftSnapshot({
    sourceText: sourceText.value,
    promptText: promptText.value,
    outlineText: outlineText.value,
    generatedScript: generatedScript.value,
    storyboardText: storyboardText.value,
  }),
)
const isDirty = computed(() =>
  hasUnsavedScriptChanges(lastSavedSnapshot.value, {
    sourceText: sourceText.value,
    promptText: promptText.value,
    outlineText: outlineText.value,
    generatedScript: generatedScript.value,
    storyboardText: storyboardText.value,
  }),
)
const leaveDialogCopy = buildScriptLeaveDialogCopy()
const templateFormDirty = computed(() => hasScriptTemplateInputChanges(templateInitialForm.value, templateForm.value))

const displayedSourceModel = computed({
  get: () => (currentStage.value === 'input' ? sourceText.value : generatedScript.value),
  set: (value: string) => {
    if (currentStage.value === 'input') {
      sourceText.value = value
      return
    }
    generatedScript.value = value
  },
})

const displayedResultModel = computed({
  get: () => (currentStage.value === 'input' ? generatedScript.value : storyboardText.value),
  set: (value: string) => {
    if (currentStage.value === 'input') {
      generatedScript.value = value
      return
    }
    storyboardText.value = value
  },
})

const getTemplatePopoverElement = (): HTMLElement | null => {
  const currentRef = templatePopoverRef.value
  if (!currentRef) return null
  if ('$el' in currentRef && currentRef.$el) return currentRef.$el
  return currentRef as HTMLElement
}

const updateTemplatePopoverPosition = (): void => {
  const wrapEl = promptWrapRef.value
  const popoverEl = getTemplatePopoverElement()
  const promptCardEl = wrapEl?.querySelector<HTMLElement>('.script-prompt-card')
  if (!wrapEl || !popoverEl || !promptCardEl) return

  const wrapRect = wrapEl.getBoundingClientRect()
  const promptCardRect = promptCardEl.getBoundingClientRect()
  templatePopoverStyle.value = {
    left: `${promptCardRect.left - wrapRect.left}px`,
    top: `${promptCardRect.bottom - wrapRect.top - 9}px`,
    width: `${promptCardRect.width}px`,
  }
}

const handleGlobalPointerDown = (event: PointerEvent): void => {
  if (!templatePanelOpen.value) return
  const target = event.target as Node | null
  if (!target || promptWrapRef.value?.contains(target)) return
  handleRequestCloseTemplatePanel()
}

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) return
    generationRequestGuard.invalidate()
    generating.value = false
    await editorStore.loadDraft(nextProjectId)
    sourceText.value = editorStore.draft?.script.content ?? ''
    outlineText.value = editorStore.draft?.script.outline ?? ''
    promptText.value = editorStore.draft?.script.prompt || DEFAULT_PROMPT
    generatedScript.value = editorStore.draft?.script.generated ?? ''
    storyboardText.value = editorStore.draft?.script.storyboard ?? ''
    lastSavedSnapshot.value = buildScriptDraftSnapshot({
      sourceText: sourceText.value,
      promptText: promptText.value,
      outlineText: outlineText.value,
      generatedScript: generatedScript.value,
      storyboardText: storyboardText.value,
    })
  },
  { immediate: true },
)

watch(sourceText, (content) => editorStore.updateScriptContent(content))
watch(outlineText, (outline) => editorStore.updateScriptOutline(outline))
watch(promptText, (prompt) => editorStore.updateScriptPrompt(prompt))
watch(generatedScript, (generated) => editorStore.updateGeneratedScript(generated))
watch(storyboardText, (storyboard) => editorStore.updateStoryboardText(storyboard))
watch(currentStage, () => {
  generationRequestGuard.invalidate()
  generating.value = false
})

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const resolveEditorError = (error: unknown, fallback: string): string =>
  resolveEditorActionErrorMessage(error, fallback)

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const syncScriptDraftToStore = (): void => {
  editorStore.updateScriptContent(sourceText.value)
  editorStore.updateScriptOutline(outlineText.value)
  editorStore.updateScriptPrompt(promptText.value)
  editorStore.updateGeneratedScript(generatedScript.value)
  editorStore.updateStoryboardText(storyboardText.value)
}

const persistDraft = async (): Promise<boolean> => {
  syncScriptDraftToStore()
  submitting.value = true
  try {
    await editorStore.saveDraft()
    markSaved()
    return true
  } catch (error) {
    if (editorStore.localSaveStatus === 'saved') {
      showToast('内容已保存到当前浏览器，服务器同步失败，可稍后重试', 'info')
    } else {
      showToast(resolveEditorError(error, '保存失败，请稍后再试'), 'error')
    }
    return false
  } finally {
    submitting.value = false
  }
}

const downloadJson = (fileName: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportStoryboardArtifact = async (): Promise<void> => {
  if (!editorStore.draft) {
    showToast('未找到当前项目草稿', 'error')
    return
  }

  const saved = await persistDraft()
  if (!saved) return

  const artifact = buildScopedProjectArtifact(
    projectId.value || editorStore.draft.projectId,
    editorStore.draft,
    'storyboard',
  )
  downloadJson(buildScopedProjectExportFileName(projectId.value || editorStore.draft.projectId), artifact)
  showToast('分镜草稿 JSON 已导出', 'success')
}

const cancelLeaveConfirm = (): void => {
  leaveConfirmOpen.value = false
  pendingLeaveTarget.value = null
}

const confirmLeave = async (): Promise<void> => {
  const nextTarget = pendingLeaveTarget.value
  leaveConfirmOpen.value = false
  pendingLeaveTarget.value = null
  if (!nextTarget) return
  bypassLeaveGuard.value = true
  await router.push(nextTarget)
}

const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
  if (!isDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  scriptTemplateStore.ensureLoaded()
})

onBeforeUnmount(() => {
  generationRequestGuard.invalidate()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('pointerdown', handleGlobalPointerDown)
})

onBeforeRouteLeave((to) => {
  if (!shouldInterceptScriptLeave(isDirty.value, bypassLeaveGuard.value)) {
    if (bypassLeaveGuard.value) bypassLeaveGuard.value = false
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
  handleStartCreateTemplate()
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
    outlineText: outlineText.value,
    generatedScript: generatedScript.value,
    storyboardText: storyboardText.value,
  })
  sourceText.value = nextFields.sourceText
  promptText.value = nextFields.promptText
  outlineText.value = nextFields.outlineText
  generatedScript.value = nextFields.generatedScript
  storyboardText.value = nextFields.storyboardText
  const saved = await persistDraft()
  if (saved) {
    showToast('提示词内容已清空', 'success')
  }
}

const resolveGenerationProjectId = (): string => projectId.value || editorStore.draft?.projectId || 'mock-project'

const handleGenerate = async (): Promise<void> => {
  if (!generatedScriptWriteCapability.available) {
    uiFeedback.showToast(generatedScriptWriteCapability.message, { tone: 'error' })
    return
  }
  if (!canGenerate.value || generating.value) return

  const requestId = generationRequestGuard.start()
  generating.value = true
  try {
    if (currentStage.value === 'input') {
      const result = await scriptGenerationWorkflowService.generateScript({
        projectId: resolveGenerationProjectId(),
        source: sourceText.value,
        prompt: promptText.value,
        modelId: selectedModelId.value,
      })
      if (!generationRequestGuard.isCurrent(requestId)) return
      generatedScript.value = result.script
      outlineText.value = result.outline ?? ''
      const saved = await persistDraft()
      if (saved) {
        showToast('剧本生成完成', 'success')
      }
      return
    }

    const result = await scriptGenerationWorkflowService.generateStoryboardScript({
      projectId: resolveGenerationProjectId(),
      script: generatedScript.value,
      prompt: promptText.value,
      modelId: selectedModelId.value,
    })
    if (!generationRequestGuard.isCurrent(requestId)) return
    storyboardText.value = result.storyboard
    const saved = await persistDraft()
    if (saved) {
      showToast('剧本分镜生成完成', 'success')
    }
  } catch (error) {
    showToast(resolveEditorError(error, '生成失败，请稍后再试'), 'error')
  } finally {
    if (generationRequestGuard.isCurrent(requestId)) {
      generating.value = false
    }
  }
}

const getStageRouteParams = (name: ScriptStageRouteName | 'editor-settings') => ({
  name,
  params: route.params,
})

const handleBack = async (): Promise<void> => {
  if (!previousStage.value) return
  const saved = await persistDraft()
  if (!saved) return
  bypassLeaveGuard.value = true
  await router.push(getStageRouteParams(STAGE_ROUTES[previousStage.value]))
}

const handleNext = async (): Promise<void> => {
  if (!canEnterNext.value) {
    showToast(
      currentStage.value === 'input' ? '请先生成剧本，再进入分镜阶段' : '请先生成剧本分镜，再进入设定页',
      'error',
    )
    return
  }

  const saved = await persistDraft()
  if (!saved) return

  if (currentStage.value === 'input') {
    bypassLeaveGuard.value = true
    await router.push(getStageRouteParams('editor-script-storyboard'))
    return
  }

  try {
    if (projectId.value) {
      await scriptWorkflowService.confirmScript(projectId.value)
      await projectStore.updateProjectStep(projectId.value, 'settings')
    }
  } catch (error) {
    showToast(resolveEditorError(error, '文案确认失败，请稍后再试'), 'error')
    return
  }

  showToast('剧本分镜已保存，正在进入设定页', 'success')
  bypassLeaveGuard.value = true
  await router.push(getStageRouteParams('editor-settings'))
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
  if (!template) return
  selectedTemplateId.value = template.id
  promptText.value = template.content
  templatePanelOpen.value = false
  resetTemplateEditor()
  showToast(`已应用模板：${template.name}`, 'success')
}

const handleStartCreateTemplate = (): void => {
  const content = promptText.value.trim()
  if (!content) {
    showToast('请先输入提示词，再保存为模板', 'error')
    return
  }
  pendingTemplateContent.value = content
  templateNameValue.value = ''
  templateNameError.value = ''
  templatePanelOpen.value = false
  templatePopoverStyle.value = {}
  templateNameDialogOpen.value = true
}

const cancelTemplateNameDialog = (): void => {
  if (templateSubmitting.value) return
  templateNameDialogOpen.value = false
  templateNameValue.value = ''
  templateNameError.value = ''
  pendingTemplateContent.value = ''
}

const confirmTemplateNameDialog = async (): Promise<void> => {
  const validation = validateScriptTemplateInput(
    scriptTemplateStore.templates,
    { name: templateNameValue.value, content: pendingTemplateContent.value },
    null,
  )
  if (!validation.ok) {
    templateNameError.value = validation.errors.name || validation.errors.content || '模板保存失败'
    return
  }

  templateSubmitting.value = true
  try {
    const created = await scriptTemplateStore.createTemplate(validation.value)
    selectedTemplateId.value = created.id
    templateNameDialogOpen.value = false
    templateNameValue.value = ''
    templateNameError.value = ''
    pendingTemplateContent.value = ''
    showToast('提示词模板已添加', 'success')
  } catch {
    templateNameError.value = '模板保存失败，请稍后再试'
  } finally {
    templateSubmitting.value = false
  }
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
  templateForm.value = { ...templateForm.value, name: value }
  templateFormErrors.value = { ...templateFormErrors.value, name: undefined }
}

const handleTemplateContentChange = (value: string): void => {
  templateForm.value = { ...templateForm.value, content: value }
  templateFormErrors.value = { ...templateFormErrors.value, content: undefined }
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
  if (!templateId) return

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
    if (editingTemplateId.value) {
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
