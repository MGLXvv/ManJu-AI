<template>
  <section class="dubbing-step">
    <div class="dubbing-step__bg" aria-hidden="true"></div>

    <div class="dubbing-workbench">
      <WorkflowStepper />

      <div class="dubbing-toolbar">
        <div class="dubbing-toolbar__filters">
          <button type="button" class="dubbing-toolbar__filter">全部角色（{{ totalCount }}）</button>

          <label class="dubbing-toolbar__search">
            <input v-model="keyword" type="text" placeholder="请输入角色名称" />
            <FigmaIcon name="search" :size="18" />
          </label>
        </div>

        <div class="dubbing-toolbar__actions">
          <span class="storyboard-top-actions__save-state-pill" :class="`is-${saveState.tone}`">{{ saveState.label }}</span>
          <button type="button" class="dubbing-toolbar__save" :disabled="submitting" @click="handleSaveExport">保存并导出</button>
          <button type="button" class="dubbing-toolbar__batch" :disabled="submitting || batchGenerateTargets.length === 0" @click="handleGenerateAll">
            一键全部配音
          </button>
          <EditorModelSelect v-model="selectedModelId" :options="modelOptions" />
        </div>
      </div>

      <div class="dubbing-grid-wrap">
        <div class="dubbing-grid">
          <DubbingRoleCard
            v-for="card in pagedCards"
            :key="card.id"
            :id="card.id"
            :title="card.title"
            :image-url="card.imageUrl"
            :selected-voice-id="card.selectedVoiceId"
            :voice-options="card.voiceOptions"
            :lines="card.lines"
            :created-at="card.createdAt"
            :playing-line-id="playingLineId"
            @update-voice="updateVoice(card.id, $event)"
            @preview-line="previewLine"
            @generate="generateCard"
            @delete="requestDeleteCard"
          />
        </div>
      </div>

      <div class="dubbing-footer">
        <button type="button" class="dubbing-footer__primary" :disabled="submitting" @click="goCompleteStep">完成并导出剪映</button>

        <div class="dubbing-footer__pager">
          <span class="dubbing-footer__count">共{{ totalCount }}项</span>

          <button type="button" class="dubbing-footer__page-btn" :disabled="currentPage === 1" @click="currentPage -= 1">
            <FigmaIcon name="pager-prev" :size="14" />
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            class="dubbing-footer__page-number"
            :class="{ 'is-active': page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="dubbing-footer__page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage += 1"
          >
            <FigmaIcon name="pager-next" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <AppConfirmDialog
      :open="leaveConfirmOpen"
      title="当前配音内容尚未保存"
      description="离开后未保存的配音模型、音色选择和生成结果会丢失。"
      confirm-text="仍要离开"
      cancel-text="继续编辑"
      confirm-tone="primary"
      @confirm="confirmLeave"
      @cancel="cancelLeaveConfirm"
    />

    <AppConfirmDialog
      :open="deleteConfirmOpen"
      title="确定删除当前角色配音卡片吗？"
      confirm-text="删除"
      cancel-text="取消"
      confirm-tone="danger"
      size="sm"
      center-title
      center-actions
      @confirm="confirmDelete"
      @cancel="cancelDeleteConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalizedLoadedGeneric, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import EditorModelSelect, { type EditorModelOption } from '@/components/editor/common/EditorModelSelect.vue'
import DubbingRoleCard from '@/components/editor/dubbing/DubbingRoleCard.vue'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { resolveDubbingBatchGenerateTargets } from '@/features/editor/dubbingBatchState'
import { hideDubbingCardById, resolveVisibleDubbingCards } from '@/features/editor/dubbingCardVisibilityState'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildDubbingDraftPatch, resolveDubbingCards } from '@/features/editor/dubbingDraftState'
import {
  buildDubbingBatchGenerateMessage,
  buildDubbingGenerateErrorMessage,
} from '@/features/editor/dubbingGenerationState'
import { resolveDubbingPlaybackTransition } from '@/features/editor/dubbingPlaybackState'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import { shouldInterceptStoryboardLeave } from '@/features/editor/storyboardLeaveConfirmState'
import { buildStoryboardSaveState } from '@/features/editor/storyboardPreviewState'
import { dubbingGenerationService } from '@/services/generation'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'

const router = useRouter()
const route = useRoute()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()

const keyword = ref('')
const currentPage = ref(1)
const pageSize = 3
const selectedModelId = ref('index-tts')
const cards = ref<DubbingRoleCardModel[]>([])
const submitting = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const pendingDeleteCardId = ref<string | null>(null)
const bypassLeaveGuard = ref(false)
const lastSavedSnapshot = ref('')
const playingLineId = ref<string | null>(null)
let previewAudio: HTMLAudioElement | null = null

const modelOptions: EditorModelOption[] = [
  { id: 'index-tts', name: 'indexTTS', iconName: 'model-openai' },
  { id: 'azure-tts', name: 'Azure TTS', iconName: 'model-openai' },
  { id: 'manju-voice', name: 'ManJu Voice', iconName: 'model-openai' },
]

const projectId = computed(() => String(route.params.projectId ?? ''))
const visibleCards = computed(() => {
  const word = keyword.value.trim().toLocaleLowerCase()
  return resolveVisibleDubbingCards(cards.value).filter((card) => {
    if (!word) {
      return true
    }

    return card.title.trim().toLocaleLowerCase().includes(word)
  })
})
const totalCount = computed(() => visibleCards.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))
const batchGenerateTargets = computed(() => resolveDubbingBatchGenerateTargets(cards.value))
const pagedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return visibleCards.value.slice(start, start + pageSize)
})
const currentSnapshot = computed(() => JSON.stringify(buildDubbingDraftPatch({ modelId: selectedModelId.value, cards: cards.value })))
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const saveState = computed(() => buildStoryboardSaveState({ submitting: submitting.value, isDirty: isDirty.value }))

const syncSavedSnapshot = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const patchCard = (id: string, patch: Partial<DubbingRoleCardModel>): void => {
  cards.value = cards.value.map((card) => (card.id === id ? { ...card, ...patch } : card))
}

const setCardLines = (cardId: string, updater: (line: DubbingRoleLineDraft) => DubbingRoleLineDraft): void => {
  cards.value = cards.value.map((card) =>
    card.id === cardId
      ? {
          ...card,
          lines: card.lines.map(updater),
        }
      : card,
  )
}

const runGenerateCard = async (
  id: string,
  options: {
    silent?: boolean
  } = {},
): Promise<boolean> => {
  const card = cards.value.find((item) => item.id === id)
  if (!card) {
    return false
  }

  setCardLines(id, (line) => ({ ...line, status: 'pending' }))
  setCardLines(id, (line) => ({ ...line, status: 'generating' }))

  try {
    const result = await dubbingGenerationService.generateCard({
      projectId: projectId.value || editorStore.currentProjectId || 'mock-project',
      modelId: selectedModelId.value,
      card,
    })

    patchCard(id, { lines: result.lines })

    if (!options.silent) {
      showToast(`已完成 ${card.title} 的配音生成`, 'success')
    }

    return true
  } catch (error) {
    setCardLines(id, (line) => ({ ...line, status: 'failed' }))

    if (!options.silent) {
      showToast(buildDubbingGenerateErrorMessage(error), 'error')
    }

    return false
  }
}

const persistDubbingDraft = async (): Promise<boolean> => {
  if (!editorStore.draft) {
    return false
  }

  submitting.value = true
  try {
    editorStore.updateDubbingDraft({
      modelId: selectedModelId.value,
      cards: cards.value,
    })
    await editorStore.saveDraft()
    syncSavedSnapshot()
    return true
  } catch {
    showToast('配音保存失败，请稍后再试', 'error')
    return false
  } finally {
    submitting.value = false
  }
}

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      cards.value = []
      selectedModelId.value = 'index-tts'
      syncSavedSnapshot()
      return
    }

    await editorStore.loadDraft(nextProjectId)
    if (editorStore.draft) {
      cards.value = resolveDubbingCards(editorStore.draft)
      selectedModelId.value = editorStore.draft.dubbing.modelId || 'index-tts'
    } else {
      cards.value = []
      selectedModelId.value = 'index-tts'
    }
    syncSavedSnapshot()
  },
  { immediate: true },
)

watch([totalCount, currentPage], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  }
})

watch(keyword, () => {
  currentPage.value = 1
})

const updateVoice = (id: string, voiceId: string): void => {
  patchCard(id, { selectedVoiceId: voiceId })
}

const previewLine = (lineId: string): void => {
  const line = cards.value.flatMap((card) => card.lines).find((item) => item.id === lineId)
  if (!line?.audioUrl) {
    showToast('请先生成配音后再试听', 'error')
    return
  }

  const transition = resolveDubbingPlaybackTransition({
    activeLineId: playingLineId.value,
    nextLineId: lineId,
  })

  try {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
      previewAudio.onended = null
      previewAudio.onerror = null
    }

    if (transition.mode === 'stop') {
      previewAudio = null
      playingLineId.value = null
      showToast(`已停止试听 ${line.shotLabel}`)
      return
    }

    previewAudio = new Audio(line.audioUrl)
    playingLineId.value = transition.nextActiveLineId
    previewAudio.onended = () => {
      playingLineId.value = null
      previewAudio = null
    }
    previewAudio.onerror = () => {
      playingLineId.value = null
      previewAudio = null
      showToast('模拟音频播放失败，请稍后再试', 'error')
    }
    void previewAudio.play()
    showToast(`正在试听 ${line.shotLabel} 的模拟音频`)
  } catch {
    playingLineId.value = null
    previewAudio = null
    showToast('模拟音频播放失败，请稍后再试', 'error')
  }
}

const generateCard = async (id: string): Promise<void> => {
  await runGenerateCard(id)
}

const requestDeleteCard = (id: string): void => {
  pendingDeleteCardId.value = id
  deleteConfirmOpen.value = true
}

const confirmDelete = (): void => {
  const cardId = pendingDeleteCardId.value
  if (!cardId) {
    deleteConfirmOpen.value = false
    return
  }

  cards.value = hideDubbingCardById(cards.value, cardId)
  pendingDeleteCardId.value = null
  deleteConfirmOpen.value = false
  showToast('角色配音卡片已删除', 'success')
}

const cancelDeleteConfirm = (): void => {
  pendingDeleteCardId.value = null
  deleteConfirmOpen.value = false
}

const handleGenerateAll = async (): Promise<void> => {
  const targets = resolveDubbingBatchGenerateTargets(cards.value)
  if (targets.length === 0) {
    showToast('暂无可批量生成的配音卡片', 'info')
    return
  }

  let successCount = 0
  let failedCount = 0

  for (const card of targets) {
    if (await runGenerateCard(card.id, { silent: true })) {
      successCount += 1
    } else {
      failedCount += 1
    }
  }

  showToast(buildDubbingBatchGenerateMessage({ successCount, failedCount }), failedCount > 0 ? 'error' : 'success')
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistDubbingDraft()
  if (!saved || !editorStore.draft) {
    return
  }

  const payload = buildScopedProjectArtifact(projectId.value, editorStore.draft, 'dubbing')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildScopedProjectExportFileName(projectId.value)
  link.click()
  URL.revokeObjectURL(objectUrl)

  showToast('配音已保存并导出', 'success')
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
  if (previewAudio) {
    previewAudio.pause()
    previewAudio = null
  }
  playingLineId.value = null
})

onBeforeRouteLeave((to: RouteLocationNormalizedLoadedGeneric) => {
  if (!shouldInterceptStoryboardLeave(isDirty.value, bypassLeaveGuard.value)) {
    if (bypassLeaveGuard.value) {
      bypassLeaveGuard.value = false
    }
    return true
  }

  pendingLeaveTarget.value = to.fullPath
  leaveConfirmOpen.value = true
  return false
})

const goCompleteStep = async (): Promise<void> => {
  const validation = validateEditorAdvance('dubbingToComplete', { cards: visibleCards.value })
  if (!validation.ok) {
    showToast(validation.message, 'error')
    return
  }

  const saved = await persistDubbingDraft()
  if (!saved) {
    return
  }

  if (projectId.value) {
    await projectStore.updateProjectStep(projectId.value, validation.nextStep)
  }

  showToast(validation.successMessage, 'success')
  await router.push({
    name: validation.routeName,
    params: route.params,
  })
}
</script>
