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
        <ScriptInputPanel v-model="sourceText" :disabled="isBusy" @import-text="handleImportText" />

        <div class="script-workbench-card__right">
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

          <div class="script-workbench-card__dash-line"></div>

          <ScriptResultPanel
            v-model="generatedScript"
            :loading="generating || optimizing"
            :disabled="isBusy"
            :placeholder-text="resultPlaceholderText"
            @optimize="handleOptimize"
          />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="script-toast">
        <div v-if="toastMessage" class="script-step__toast-stack" aria-live="polite">
          <div class="script-step__toast">{{ toastMessage }}</div>
        </div>
      </Transition>
    </Teleport>

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
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import EditorModelSelect from '@/components/editor/common/EditorModelSelect.vue'
import ScriptInputPanel from '@/components/editor/script/ScriptInputPanel.vue'
import ScriptPromptPanel from '@/components/editor/script/ScriptPromptPanel.vue'
import ScriptResultPanel from '@/components/editor/script/ScriptResultPanel.vue'
import { buildScriptDraftSnapshot, hasUnsavedScriptChanges } from '@/features/editor/scriptDraftState'
import { canEnterStoryboard, generateMockScript, optimizeMockScript } from '@/features/editor/scriptGenerationState'
import { buildScriptLeaveDialogCopy, shouldInterceptScriptLeave } from '@/features/editor/scriptLeaveConfirmState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const route = useRoute()
const editorStore = useEditorStore()
const projectStore = useProjectStore()

const DEFAULT_PROMPT = '请将输入故事整理为适合漫画短剧制作的三幕结构，保留核心冲突、角色转折和后续可拆分的镜头线索。'

const sourceText = ref('')
const promptText = ref(DEFAULT_PROMPT)
const generatedScript = ref('')
const generating = ref(false)
const optimizing = ref(false)
const submitting = ref(false)
const selectedModelId = ref('gpt-4.0')
const toastMessage = ref('')
const leaveConfirmOpen = ref(false)
const lastSavedSnapshot = ref(buildScriptDraftSnapshot({ sourceText: '', promptText: DEFAULT_PROMPT, generatedScript: '' }))
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const bypassLeaveGuard = ref(false)
let toastTimer: number | null = null

const projectId = computed(() => String(route.params.projectId ?? ''))
const canGenerate = computed(() => Boolean(sourceText.value.trim() || promptText.value.trim()))
const canEnterNext = computed(() => canEnterStoryboard(generatedScript.value))
const isBusy = computed(() => generating.value || optimizing.value || submitting.value)
const actionState = computed<'idle' | 'saving' | 'generating' | 'optimizing'>(() => {
  if (submitting.value) return 'saving'
  if (generating.value) return 'generating'
  if (optimizing.value) return 'optimizing'
  return 'idle'
})
const statusText = computed(() => {
  switch (actionState.value) {
    case 'saving':
      return '正在保存当前文案内容'
    case 'generating':
      return '正在根据原始文案生成剧本'
    case 'optimizing':
      return '正在优化已生成的剧本'
    default:
      return isDirty.value ? '当前内容有修改，建议先保存' : '当前内容已同步到草稿'
  }
})
const resultPlaceholderText = computed(() => {
  if (optimizing.value) {
    return '正在优化剧本内容...'
  }

  return '正在生成剧本...'
})
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

const showToast = (message: string): void => {
  toastMessage.value = message
  if (toastTimer) {
    window.clearTimeout(toastTimer)
  }

  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, 2400)
}

const resolveEditorError = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : ''

  switch (message) {
    case 'EDITOR_SAVE_FAILED':
      return '保存失败，请检查内容后重试'
    case 'SCRIPT_GENERATE_FAILED':
      return '剧本生成失败，请调整文案或提示词后重试'
    case 'SCRIPT_OPTIMIZE_FAILED':
      return 'AI 优化失败，请稍后再试'
    default:
      return fallback
  }
}

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const persistDraft = async (): Promise<boolean> => {
  submitting.value = true
  try {
    await editorStore.saveDraft()
    markSaved()
    return true
  } catch (error) {
    showToast(resolveEditorError(error, '保存失败，请稍后再试'))
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
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
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

const handleSave = async (): Promise<void> => {
  const saved = await persistDraft()
  if (saved) {
    showToast('文案内容已保存')
  }
}

const handleOpenTemplate = (): void => {
  promptText.value = '请将输入故事拆分为适合分镜制作的镜头段落，每段包含场景、角色动作、台词或旁白，并标注情绪变化。'
}

const handleDelete = async (): Promise<void> => {
  sourceText.value = ''
  promptText.value = DEFAULT_PROMPT
  generatedScript.value = ''
  const saved = await persistDraft()
  if (saved) {
    showToast('文案内容已清空')
  }
}

const handleGenerate = async (): Promise<void> => {
  if (!canGenerate.value || generating.value || optimizing.value) {
    return
  }

  generating.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 650))
    generatedScript.value = generateMockScript({
      sourceText: sourceText.value,
      promptText: promptText.value,
    })
    const saved = await persistDraft()
    if (saved) {
      showToast('剧本生成完成')
    }
  } catch (error) {
    showToast(resolveEditorError(error, '剧本生成失败，请稍后再试'))
  } finally {
    generating.value = false
  }
}

const handleOptimize = async (): Promise<void> => {
  if (!generatedScript.value.trim() || generating.value || optimizing.value) {
    return
  }

  optimizing.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 420))
    generatedScript.value = optimizeMockScript(generatedScript.value)
    const saved = await persistDraft()
    if (saved) {
      showToast('剧本已完成 AI 优化')
    }
  } catch (error) {
    showToast(resolveEditorError(error, 'AI 优化失败，请稍后再试'))
  } finally {
    optimizing.value = false
  }
}

const handleNext = async (): Promise<void> => {
  if (!canEnterNext.value) {
    showToast('请先生成剧本，再进入下一步')
    return
  }

  const saved = await persistDraft()
  if (!saved) {
    return
  }

  if (projectId.value) {
    await projectStore.updateProjectStep(projectId.value, 'settings')
  }

  router.push({
    name: 'editor-settings',
    params: route.params,
  })
}
</script>
