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
          <span class="storyboard-top-actions__save-state-pill" :class="`is-${saveState.tone}`">{{
            saveState.label
          }}</span>
          <button type="button" class="dubbing-toolbar__save" :disabled="submitting" @click="handleSaveExport">
            保存并导出
          </button>
          <button
            type="button"
            class="dubbing-toolbar__batch"
            :disabled="isBatchGenerateDisabled"
            @click="handleGenerateAll"
          >
            一键全部配音
          </button>
          <EditorModelSelect v-model="selectedModelId" :options="modelOptions" />
        </div>
      </div>

      <div ref="dubbingGridWrapRef" class="dubbing-grid-wrap">
        <div class="dubbing-grid">
          <div v-for="(row, rowIndex) in dubbingRows" :key="`dubbing-row-${rowIndex}`" class="dubbing-grid__row">
            <DubbingRoleCard
              v-for="card in row"
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
      </div>

      <div class="dubbing-footer">
        <button type="button" class="dubbing-footer__primary" :disabled="submitting" @click="goCompleteStep">
          进入结果汇总
        </button>

        <div class="dubbing-footer__pager">
          <span class="dubbing-footer__count">共{{ totalCount }}项</span>

          <button
            type="button"
            class="dubbing-footer__page-btn"
            :disabled="currentPage === 1"
            @click="currentPage -= 1"
          >
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
import {
  onBeforeRouteLeave,
  useRoute,
  useRouter,
  type RouteLocationNormalizedLoadedGeneric,
  type RouteLocationRaw,
} from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import EditorModelSelect, { type EditorModelOption } from '@/components/editor/common/EditorModelSelect.vue'
import DubbingRoleCard from '@/components/editor/dubbing/DubbingRoleCard.vue'
import WorkflowStepper from '@/components/editor/WorkflowStepper.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import {
  buildDubbingCardGenerateDisabledReason,
  resolveDubbingBatchAvailability,
} from '@/features/editor/dubbingBatchState'
import { hideDubbingCardById, resolveVisibleDubbingCards } from '@/features/editor/dubbingCardVisibilityState'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildDubbingDraftPatch, resolveDubbingCards } from '@/features/editor/dubbingDraftState'
import {
  buildDubbingBatchGenerateMessage,
  buildDubbingGenerateErrorMessage,
} from '@/features/editor/dubbingGenerationState'
import { resolveDubbingPlaybackTransition } from '@/features/editor/dubbingPlaybackState'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import { createBrowserJsonDownloadController } from '@/features/shared/jsonDownloadState'
import { createScopedAsyncTaskRunner } from '@/features/shared/scopedAsyncTaskState'
import { createProjectPhaseRunner, isProjectRouteContextCurrent } from '@/features/shared/projectPhaseRunnerState'
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
const jsonDownloadController = createBrowserJsonDownloadController()

const DUBBING_CARD_WIDTH = 330
const DUBBING_CARD_GAP = 16
const DUBBING_MAX_CARDS_PER_PAGE = 4

const keyword = ref('')
const currentPage = ref(1)
const selectedModelId = ref('index-tts')
const cards = ref<DubbingRoleCardModel[]>([])
const submitting = ref(false)
const batchGenerating = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const pendingDeleteCardId = ref<string | null>(null)
const bypassLeaveGuard = ref(false)
const lastSavedSnapshot = ref('')
const playingLineId = ref<string | null>(null)
const dubbingGridWrapRef = ref<HTMLElement | null>(null)
const rowSize = ref(3)
let previewAudio: HTMLAudioElement | null = null
let resizeObserver: ResizeObserver | null = null
const generationTasks = createScopedAsyncTaskRunner()
const batchGenerationTasks = createScopedAsyncTaskRunner()
const stepTransitionTasks = createProjectPhaseRunner()

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
const pageSize = computed(() => Math.max(1, Math.min(rowSize.value, DUBBING_MAX_CARDS_PER_PAGE)))
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const batchAvailability = computed(() => resolveDubbingBatchAvailability(cards.value))
const isBatchGenerateDisabled = computed(() => submitting.value || batchGenerating.value)
const pagedCards = computed(() => {
  const size = pageSize.value
  const start = (currentPage.value - 1) * size
  return visibleCards.value.slice(start, start + size)
})
const dubbingRows = computed(() => {
  const rows: DubbingRoleCardModel[][] = []
  const size = Math.max(1, pageSize.value)
  for (let index = 0; index < pagedCards.value.length; index += size) {
    rows.push(pagedCards.value.slice(index, index + size))
  }
  return rows
})
const currentSnapshot = computed(() =>
  JSON.stringify(buildDubbingDraftPatch({ modelId: selectedModelId.value, cards: cards.value })),
)
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const saveState = computed(() => buildStoryboardSaveState({ submitting: submitting.value, isDirty: isDirty.value }))

const recalcDubbingRowSize = (): void => {
  const width = dubbingGridWrapRef.value?.clientWidth ?? 0
  if (width <= 0) {
    rowSize.value = 3
    return
  }

  const fitCount = Math.floor((width + DUBBING_CARD_GAP) / (DUBBING_CARD_WIDTH + DUBBING_CARD_GAP))
  rowSize.value = Math.max(1, fitCount)
}

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
): Promise<'success' | 'failed' | 'stale'> => {
  const card = cards.value.find((item) => item.id === id)
  if (!card) {
    return 'failed'
  }

  const unavailableMessage = buildDubbingCardGenerateDisabledReason(card)
  if (unavailableMessage) {
    if (!options.silent) {
      showToast(unavailableMessage, 'info')
    }
    return 'failed'
  }

  const targetProjectId = projectId.value || editorStore.currentProjectId || 'mock-project'
  const targetModelId = selectedModelId.value
  setCardLines(id, (line) => ({ ...line, status: 'pending' }))
  setCardLines(id, (line) => ({ ...line, status: 'generating' }))

  try {
    const taskResult = await generationTasks.run(() =>
      dubbingGenerationService.generateCard({
        projectId: targetProjectId,
        modelId: targetModelId,
        card,
      }),
    )
    if (taskResult.status === 'stale') return 'stale'

    patchCard(id, { lines: taskResult.value.lines })

    if (!options.silent) {
      showToast(`已完成 ${card.title} 的配音生成`, 'success')
    }

    return 'success'
  } catch (error) {
    setCardLines(id, (line) => ({ ...line, status: 'failed' }))

    if (!options.silent) {
      showToast(buildDubbingGenerateErrorMessage(error), 'error')
    }

    return 'failed'
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
    generationTasks.invalidate()
    batchGenerationTasks.invalidate()
    stepTransitionTasks.invalidate()
    batchGenerating.value = false
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

watch([totalCount, currentPage, pageSize], () => {
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
  const card = cards.value.find((item) => item.id === id)
  if (!card) {
    showToast('当前配音卡片不存在，请刷新后重试', 'error')
    return
  }

  const unavailableMessage = buildDubbingCardGenerateDisabledReason(card)
  if (unavailableMessage) {
    showToast(unavailableMessage, 'info')
    return
  }

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
  if (batchGenerating.value) {
    return
  }

  const availability = batchAvailability.value
  if (!availability.canGenerate) {
    showToast(availability.disabledReason || '当前没有可批量生成的配音卡片', 'info')
    return
  }

  batchGenerating.value = true
  try {
    const result = await batchGenerationTasks.run(async () => {
      let successCount = 0
      let failedCount = 0

      for (const card of availability.targetCards) {
        const outcome = await runGenerateCard(card.id, { silent: true })
        if (outcome === 'stale') break
        if (outcome === 'success') {
          successCount += 1
        } else {
          failedCount += 1
        }
      }

      return { successCount, failedCount }
    })
    if (result.status === 'stale') return

    batchGenerating.value = false
    showToast(buildDubbingBatchGenerateMessage(result.value), result.value.failedCount > 0 ? 'error' : 'success')
  } catch (error) {
    batchGenerating.value = false
    showToast(buildDubbingGenerateErrorMessage(error), 'error')
  }
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistDubbingDraft()
  if (!saved || !editorStore.draft) {
    return
  }

  const payload = buildScopedProjectArtifact(projectId.value, editorStore.draft, 'dubbing')
  jsonDownloadController.downloadJson(buildScopedProjectExportFileName(projectId.value), payload)

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
  recalcDubbingRowSize()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      recalcDubbingRowSize()
    })
    if (dubbingGridWrapRef.value) {
      resizeObserver.observe(dubbingGridWrapRef.value)
    }
  } else {
    window.addEventListener('resize', recalcDubbingRowSize)
  }
})

onBeforeUnmount(() => {
  generationTasks.invalidate()
  batchGenerationTasks.invalidate()
  stepTransitionTasks.invalidate()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('resize', recalcDubbingRowSize)
  resizeObserver?.disconnect()
  if (previewAudio) {
    previewAudio.pause()
    previewAudio = null
  }
  jsonDownloadController.releaseAll()
})

const handleBlockedNavigation = (target: RouteLocationRaw): void => {
  pendingLeaveTarget.value = target
  leaveConfirmOpen.value = true
}

const isLeavingDubbingStep = (to: RouteLocationNormalizedLoadedGeneric): boolean => to.name !== 'editor-dubbing'

onBeforeRouteLeave((to) => {
  if (bypassLeaveGuard.value) {
    bypassLeaveGuard.value = false
    return true
  }

  if (isLeavingDubbingStep(to) && shouldInterceptStoryboardLeave(isDirty.value, bypassLeaveGuard.value)) {
    handleBlockedNavigation(to.fullPath)
    return false
  }

  return true
})

const goCompleteStep = async (): Promise<void> => {
  if (!editorStore.draft) {
    return
  }

  const validation = validateEditorAdvance('dubbingToComplete', { cards: cards.value })
  if (!validation.ok) {
    showToast(validation.message, 'info')
    return
  }

  const targetProjectId = projectId.value
  const targetRouteName = route.name
  const saved = await persistDubbingDraft()
  if (
    !saved ||
    !isProjectRouteContextCurrent({
      targetProjectId,
      currentProjectId: projectId.value,
      targetRouteName,
      currentRouteName: route.name,
    })
  ) {
    return
  }

  try {
    if (targetProjectId) {
      const advanced = await stepTransitionTasks.run(targetProjectId, [
        (scopedProjectId) => projectStore.updateProjectStep(scopedProjectId, validation.nextStep),
      ])
      if (
        !advanced ||
        !isProjectRouteContextCurrent({
          targetProjectId,
          currentProjectId: projectId.value,
          targetRouteName,
          currentRouteName: route.name,
        })
      ) {
        return
      }
    }
  } catch {
    showToast('进入完成页失败，请稍后再试', 'error')
    return
  }

  showToast(validation.successMessage, 'success')
  bypassLeaveGuard.value = true
  await router.push({ name: validation.routeName, params: { projectId: targetProjectId } })
}
</script>
