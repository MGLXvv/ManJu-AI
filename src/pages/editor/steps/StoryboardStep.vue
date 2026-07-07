<template>
  <section class="storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div
      class="storyboard-layout"
      :class="{ 'is-reference-collapsed': isReferenceCollapsed, 'is-timeline-collapsed': isTimelineCollapsed }"
    >
      <div class="storyboard-layout__main">
        <section class="storyboard-main-card" :class="{ 'has-batch-toolbar': batchMode }">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            :batch-label="batchMode ? '退出批量' : '批量操作'"
            :mode-label="storyboardModeLabel"
            :save-state-label="saveState.label"
            :save-state-tone="saveState.tone"
            @batch-generate="handleBatchTrigger"
            @save-export="handleSaveExport"
            @next="goVideoStep"
          />

          <BatchSelectionToolbar
            v-if="batchMode"
            action-label="批量生成"
            primary-label="全选分镜"
            :selected-count="selectedShotIds.length"
            :total-count="shots.length"
            :primary-selected="isAllShotsSelected"
            :action-disabled="isBatchActionDisabled"
            @exit="exitBatchMode"
            @toggle-primary="toggleSelectAllShots"
            @action="handleBatchGenerate"
          />

          <div class="storyboard-main-card__divider"></div>

          <div
            class="storyboard-main-card__body"
            :class="{ 'is-prompt-collapsed': isPromptCollapsed, 'is-empty': !currentShot }"
          >
            <StoryboardPromptPanel
              v-if="currentShot"
              :shot="currentShot"
              :tag-options="tagOptions"
              :style-options="styleOptions"
              :mode="storyboardMode"
              :insert-mode="insertMode"
              :insert-draft="insertMode ? insertDraft : null"
              :collapsed="isPromptCollapsed"
              :optimizing-prompt="optimizingPrompt"
              @add-tag="handleAddTag"
              @remove-tag="handleRemoveTag"
              @update-prompt="updatePrompt"
              @optimize-prompt="optimizePrompt"
              @update-style="updateStyle"
              @update-ratio="updateRatio"
              @update-insert-tag="updateInsertTag"
              @update-insert-prompt="updateInsertPrompt"
              @optimize-insert-prompt="optimizeInsertPrompt"
              @update-insert-style="updateInsertStyle"
              @update-insert-ratio="updateInsertRatio"
              @confirm-insert="confirmInsertShot"
              @cancel-insert="resetInsertMode"
              @toggle-collapse="togglePromptPanel"
              @generate-shot="generateShot"
            />

            <div v-else class="storyboard-empty-state">
              <p class="storyboard-empty-state__title">暂无分镜</p>
              <p class="storyboard-empty-state__desc">可根据已确认剧本生成分镜。</p>
              <button
                type="button"
                class="storyboard-empty-state__action"
                :disabled="generatingStoryboardList"
                @click="generateStoryboardFromScript"
              >
                {{ generatingStoryboardList ? '分镜生成中...' : '根据剧本生成分镜' }}
              </button>
            </div>

            <StoryboardPreviewPanel
              v-if="currentShot"
              :shot="currentShot"
              :mode="storyboardMode"
              @toggle-hidden-shot="toggleHidden"
              @lock-shot="toggleLock"
              @copy-shot="copyShot"
              @delete-shot="deleteShot"
              @edit-shot="openEditDialog"
              @view-shot="openPreviewDialog('view')"
              @zoom-shot="upscaleShot"
            />
          </div>
        </section>
      </div>

      <StoryboardReferenceRail
        class="storyboard-layout__reference"
        :images="currentReferenceImages"
        :collapsed="isReferenceCollapsed"
        :active-image-url="currentShot?.imageUrl ?? ''"
        :disabled="Boolean(currentShot?.isLocked)"
        @select="selectReference"
        @toggle-collapse="toggleReferenceRail"
      />

      <StoryboardTimeline
        class="storyboard-layout__timeline"
        :shots="shots"
        :active-shot-id="activeShotId"
        :mode="storyboardMode"
        :insert-after-shot-id="insertCardAfterShotId"
        :batch-mode="batchMode"
        :batch-selected-ids="selectedShotIds"
        :collapsed="isTimelineCollapsed"
        @select="handleTimelineSelect"
        @upload="triggerUploadForShot"
        @copy="copyShot"
        @delete="deleteShot"
        @review="toggleStoryboardReviewed"
        @reorder="reorderShots"
        @insert-after="openInsertMode"
        @create="createBlankShot"
        @toggle-collapse="toggleTimelineCollapse"
      />
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
      :open="deleteConfirmOpen"
      :title="deleteDialogCopy.title"
      :confirm-text="deleteDialogCopy.confirmText"
      :cancel-text="deleteDialogCopy.cancelText"
      confirm-tone="danger"
      size="sm"
      center-title
      center-actions
      @confirm="confirmDelete"
      @cancel="cancelDeleteConfirm"
    />

    <StoryboardImagePreviewDialog
      :open="previewDialogOpen"
      :image-url="previewDialogImageUrl"
      :title="previewDialogTitle"
      :zoom-mode="previewDialogMode === 'zoom'"
      @close="closePreviewDialog"
    />

    <StoryboardImageEditDialog
      :open="editDialogOpen"
      :image-url="editDialogImageUrl"
      :title="editDialogTitle"
      :loading="editingImage"
      @close="closeEditDialog"
      @apply="applyImageEdit"
    />

    <StoryboardBatchGenerateDialog
      :open="batchDialogOpen"
      :selected-count="selectedShotIds.length"
      :initial-mode="batchGenerationMode"
      :initial-scheduled-date="batchScheduledDate"
      :initial-scheduled-time="batchScheduledTime"
      @cancel="closeBatchGenerateDialog"
      @confirm="confirmBatchGenerate"
    />
  </section>

  <input
    ref="uploadInputRef"
    class="storyboard-step__upload-input"
    type="file"
    accept="image/png,image/jpeg,image/webp,image/svg+xml"
    @change="handleUploadFileChange"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import StoryboardBatchGenerateDialog from '@/components/editor/storyboard/StoryboardBatchGenerateDialog.vue'
import StoryboardImageEditDialog from '@/components/editor/storyboard/StoryboardImageEditDialog.vue'
import StoryboardImagePreviewDialog from '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue'
import StoryboardPreviewPanel from '@/components/editor/storyboard/StoryboardPreviewPanel.vue'
import StoryboardPromptPanel from '@/components/editor/storyboard/StoryboardPromptPanel.vue'
import StoryboardReferenceRail from '@/components/editor/storyboard/StoryboardReferenceRail.vue'
import StoryboardTimeline from '@/components/editor/storyboard/StoryboardTimeline.vue'
import StoryboardTopActions from '@/components/editor/storyboard/StoryboardTopActions.vue'
import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { apiMode } from '@/api/shared/apiMode'
import { resolveStoryboardBatchAvailability } from '@/features/editor/storyboardBatchState'
import { buildStoryboardDeleteDialogCopy, buildStoryboardDeleteToastMessage } from '@/features/editor/storyboardDeleteState'
import { buildStoryboardDraftSnapshot } from '@/features/editor/storyboardDirtyState'
import { resolveStoryboardTagOptions } from '@/features/editor/storyboardDraftState'
import {
  buildStoryboardGenerateErrorMessage,
} from '@/features/editor/storyboardGenerationState'
import { buildStoryboardLeaveDialogCopy, shouldInterceptStoryboardLeave } from '@/features/editor/storyboardLeaveConfirmState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import { loadStoryboardPromptCollapsed, saveStoryboardPromptCollapsed } from '@/features/editor/storyboardPanelState'
import {
  resolveStoryboardShots,
} from '@/features/editor/storyboardPersistState'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import {
  buildStoryboardEditedImage,
  buildStoryboardSaveState,
  canOpenStoryboardImageTools,
  type StoryboardSelectionRect,
} from '@/features/editor/storyboardPreviewState'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useStoryboardStore } from '@/stores/storyboard'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import { storyboardWorkflowService } from '@/services/editor/storyboardWorkflow.service'
import { storyboardPromptService } from '@/services/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { StoryboardInsertDraft, StoryboardShot, StoryboardTagType } from '@/types/storyboard'

const store = useStoryboardStore()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()
const router = useRouter()
const route = useRoute()

const projectId = computed(() => String(route.params.projectId ?? ''))
const shots = computed(() => store.shots)
const activeShotId = computed(() => store.activeShotId)
const activeShot = computed(() => store.activeShot)
const referenceImages = computed(() => store.referenceImages)
const tagOptions = computed(() => store.tagOptions)
const styleOptions = computed(() => store.styleOptions)
const currentShot = computed(() => activeShot.value ?? shots.value[0] ?? null)
const currentReferenceImages = computed(() => currentShot.value?.referenceImages ?? referenceImages.value)
const isReferenceCollapsed = ref(false)
const isTimelineCollapsed = ref(false)
const isPromptCollapsed = ref(loadStoryboardPromptCollapsed())
const batchMode = ref(false)
const selectedShotIds = ref<string[]>([])
const submitting = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
const batchDialogOpen = ref(false)
const batchGenerating = ref(false)
const generatingStoryboardList = ref(false)
const persistedStoryboardIds = ref<string[]>([])
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const pendingDeleteShotId = ref<string | null>(null)
const bypassLeaveGuard = ref(false)
const lastSavedSnapshot = ref('')
const previewDialogOpen = ref(false)
const previewDialogMode = ref<'view' | 'zoom'>('view')
const editDialogOpen = ref(false)
const editingImage = ref(false)
const pendingUploadShotId = ref<string | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)
const batchGenerationMode = ref<'immediate' | 'scheduled'>('immediate')
const batchScheduledDate = ref('')
const batchScheduledTime = ref('08:00')
const pendingInsertAfterShotId = ref<string | null>(null)
const optimizingPrompt = ref(false)

const isAllShotsSelected = computed(
  () => shots.value.length > 0 && shots.value.every((shot) => selectedShotIds.value.includes(shot.id)),
)
const batchAvailability = computed(() =>
  resolveStoryboardBatchAvailability({
    shots: shots.value,
    selectedShotIds: selectedShotIds.value,
    overwriteStrategy: 'skip-generated',
  }),
)
const isBatchActionDisabled = computed(() => submitting.value || batchGenerating.value || selectedShotIds.value.length === 0)
const storyboardMode = computed<StoryboardMode>(() => editorStore.draft?.storyboardGenerationMode ?? null)
const storyboardModeLabel = computed(() => {
  if (storyboardMode.value === 'image') return '图片生成'
  if (storyboardMode.value === 'multi-param') return '多参生成'
  return '未选择模式'
})
const currentSnapshot = computed(() => buildStoryboardDraftSnapshot(shots.value))
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const saveState = computed(() => buildStoryboardSaveState({ submitting: submitting.value, isDirty: isDirty.value }))
const leaveDialogCopy = buildStoryboardLeaveDialogCopy()
const deleteDialogCopy = buildStoryboardDeleteDialogCopy()
const previewDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const previewDialogTitle = computed(() => currentShot.value?.title ?? '分镜预览')
const editDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const editDialogTitle = computed(() => currentShot.value?.title ?? '当前分镜')
const insertCardAfterShotId = computed(() =>
  storyboardMode.value === 'multi-param' && !batchMode.value ? activeShotId.value || null : null,
)
const insertMode = computed(() => Boolean(pendingInsertAfterShotId.value))

const createInsertDraft = (): StoryboardInsertDraft => ({
  characterIds: [],
  sceneIds: [],
  propIds: [],
  prompt: '',
  style: styleOptions.value[0] ?? '写实',
  ratio: '16:9',
})

const insertDraft = ref<StoryboardInsertDraft>(createInsertDraft())

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      await store.loadDefaults()
      lastSavedSnapshot.value = buildStoryboardDraftSnapshot(store.shots)
      return
    }

    await editorStore.loadDraft(nextProjectId)
    const nextTagOptions = resolveStoryboardTagOptions(editorStore.draft, tagOptions.value)
    store.setTagOptions(nextTagOptions)

    if (editorStore.draft?.shots.length) {
      const resolvedShots = resolveStoryboardShots(
        editorStore.draft.shots,
        nextTagOptions,
        editorStore.draft.settingAssets,
      )
      store.replaceShots(resolvedShots)
      updatePersistedStoryboardIds(resolvedShots)
    } else if (apiMode === 'http') {
      store.replaceShots([])
      updatePersistedStoryboardIds([])
    } else {
      await store.loadDefaults()
    }

    lastSavedSnapshot.value = buildStoryboardDraftSnapshot(store.shots)
  },
  { immediate: true },
)

watch(
  shots,
  (value) => {
    if (!activeShot.value && value.length > 0) {
      store.selectShot(value[0].id)
    }

    selectedShotIds.value = selectedShotIds.value.filter((id) => value.some((shot) => shot.id === id))
    if (pendingDeleteShotId.value && !value.some((shot) => shot.id === pendingDeleteShotId.value)) {
      pendingDeleteShotId.value = null
      deleteConfirmOpen.value = false
    }
    if (pendingInsertAfterShotId.value && !value.some((shot) => shot.id === pendingInsertAfterShotId.value)) {
      pendingInsertAfterShotId.value = null
      insertDraft.value = createInsertDraft()
    }
  },
  { immediate: true },
)

watch(
  storyboardMode,
  (value) => {
    if (value !== 'multi-param') {
      pendingInsertAfterShotId.value = null
      insertDraft.value = createInsertDraft()
    }
  },
  { immediate: true },
)

watch(isPromptCollapsed, (value) => {
  saveStoryboardPromptCollapsed(value)
})

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const updatePersistedStoryboardIds = (nextShots: StoryboardShot[]): void => {
  persistedStoryboardIds.value = nextShots
    .map((shot) => shot.id)
    .filter((id) => !isLocalStoryboardShotId(id))
}

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const persistStoryboardDraft = async (): Promise<boolean> => {
  if (!editorStore.draft) {
    return false
  }

  submitting.value = true
  try {
    editorStore.updateStoryboardShots(shots.value)

    if (apiMode === 'http' && projectId.value) {
      const syncedPatch = await storyboardWorkflowService.syncStoryboards(projectId.value, {
        currentShots: shots.value,
        persistedIds: persistedStoryboardIds.value,
      })

      if (syncedPatch) {
        const draft = editorStore.draft
        if (!draft) {
          showToast('分镜同步失败，请稍后重试', 'error')
          return false
        }

        const nextTagOptions = resolveStoryboardTagOptions(draft, tagOptions.value)
        const syncedShots = resolveStoryboardShots(
          syncedPatch.shots,
          nextTagOptions,
          draft.settingAssets,
        )

        editorStore.updateStoryboardShots(syncedShots)
        store.setTagOptions(nextTagOptions)
        store.replaceShots(syncedShots)
        updatePersistedStoryboardIds(syncedShots)
      }
    }

    await editorStore.saveDraft()
    markSaved()
    return true
  } catch {
    showToast(apiMode === 'http' ? '分镜同步失败，请稍后重试' : '分镜保存失败，请稍后再试', 'error')
    return false
  } finally {
    submitting.value = false
  }
}

const selectShot = (id: string): void => {
  store.selectShot(id)
}

const resetInsertMode = (): void => {
  pendingInsertAfterShotId.value = null
  insertDraft.value = createInsertDraft()
}

const handleTimelineSelect = (id: string): void => {
  if (batchMode.value) {
    selectedShotIds.value = selectedShotIds.value.includes(id)
      ? selectedShotIds.value.filter((item) => item !== id)
      : [...selectedShotIds.value, id]
    return
  }

  resetInsertMode()
  selectShot(id)
}

const handleAddTag = (type: StoryboardTagType, tagId: string): void => {
  const source =
    type === 'character'
      ? tagOptions.value.characters
      : type === 'scene'
        ? tagOptions.value.scenes
        : tagOptions.value.props
  const target = source.find((item) => item.id === tagId)
  if (!target) return
  store.addTagToActiveShot(type, target)
}

const handleRemoveTag = (type: StoryboardTagType, tagId: string): void => {
  store.removeTagFromActiveShot(type, tagId)
}

const updatePrompt = (value: string): void => {
  store.updateActiveShotPrompt(value)
}

const updateStyle = (value: string): void => {
  store.updateActiveShotStyle(value)
}

const updateRatio = (value: '16:9' | '9:16'): void => {
  store.updateActiveShotRatio(value)
}

const generateStoryboardFromScript = async (): Promise<void> => {
  if (!projectId.value || generatingStoryboardList.value) {
    return
  }

  generatingStoryboardList.value = true

  try {
    const patch = await storyboardWorkflowService.generateStoryboard(projectId.value)

    if (!patch || patch.shots.length === 0) {
      showToast('后端未返回可用分镜，请稍后重试', 'error')
      return
    }

    const draft = editorStore.draft
    if (!draft) {
      showToast('分镜生成失败，请稍后再试', 'error')
      return
    }

    const nextTagOptions = resolveStoryboardTagOptions(draft, tagOptions.value)
    const resolvedShots = resolveStoryboardShots(patch.shots, nextTagOptions, draft.settingAssets)

    editorStore.updateStoryboardShots(resolvedShots)
    store.setTagOptions(nextTagOptions)
    store.replaceShots(resolvedShots)
    updatePersistedStoryboardIds(resolvedShots)
    markSaved()
    showToast('分镜已生成', 'success')
  } catch {
    showToast('分镜生成失败，请确认剧本已确认后重试', 'error')
  } finally {
    generatingStoryboardList.value = false
  }
}

const generateShot = async (): Promise<void> => {
  try {
    await store.generateActiveShot()
    showToast('分镜已生成', 'success')
  } catch (error) {
    showToast(buildStoryboardGenerateErrorMessage(error), 'error')
  }
}

const createBlankShot = (): void => {
  resetInsertMode()
  store.createBlankShot()
}

const copyShot = (id: string): void => {
  store.copyShot(id)
  showToast('分镜已复制', 'success')
}

const reorderShots = ({ draggedId, targetId }: { draggedId: string; targetId: string }): void => {
  store.moveShot(draggedId, targetId)
}

const openInsertMode = (afterShotId: string): void => {
  pendingInsertAfterShotId.value = afterShotId
  insertDraft.value = createInsertDraft()
}

const updateInsertTag = (type: StoryboardTagType, tagId: string): void => {
  if (type === 'character') {
    insertDraft.value.characterIds = tagId ? [tagId] : []
    return
  }

  if (type === 'scene') {
    insertDraft.value.sceneIds = tagId ? [tagId] : []
    return
  }

  insertDraft.value.propIds = tagId ? [tagId] : []
}

const updateInsertPrompt = (prompt: string): void => {
  insertDraft.value.prompt = prompt
}

const optimizePrompt = async (): Promise<void> => {
  const shot = currentShot.value
  if (!shot || !shot.prompt.trim() || shot.isLocked || optimizingPrompt.value) {
    return
  }

  optimizingPrompt.value = true
  try {
    const result = await storyboardPromptService.optimizePrompt({
      projectId: projectId.value,
      shotId: shot.id,
      prompt: shot.prompt,
      mode: 'active-shot',
    })
    store.updateActiveShotPrompt(result.prompt)
    showToast('画面描述已完成 AI 优化', 'success')
  } catch (error) {
    showToast(buildStoryboardGenerateErrorMessage(error), 'error')
  } finally {
    optimizingPrompt.value = false
  }
}

const updateInsertStyle = (style: string): void => {
  insertDraft.value.style = style
}

const updateInsertRatio = (ratio: '16:9' | '9:16'): void => {
  insertDraft.value.ratio = ratio
}

const optimizeInsertPrompt = async (): Promise<void> => {
  if (!insertDraft.value.prompt.trim() || optimizingPrompt.value) {
    return
  }

  optimizingPrompt.value = true
  try {
    const result = await storyboardPromptService.optimizePrompt({
      projectId: projectId.value,
      prompt: insertDraft.value.prompt,
      mode: 'insert-shot',
    })
    insertDraft.value.prompt = result.prompt
    showToast('画面描述已完成 AI 优化', 'success')
  } catch (error) {
    showToast(buildStoryboardGenerateErrorMessage(error), 'error')
  } finally {
    optimizingPrompt.value = false
  }
}

const applyInsertDraftTags = (): void => {
  for (const characterId of insertDraft.value.characterIds) {
    const character = tagOptions.value.characters.find((item) => item.id === characterId)
    if (character) {
      store.addTagToActiveShot('character', character)
    }
  }

  for (const sceneId of insertDraft.value.sceneIds) {
    const scene = tagOptions.value.scenes.find((item) => item.id === sceneId)
    if (scene) {
      store.addTagToActiveShot('scene', scene)
    }
  }

  for (const propId of insertDraft.value.propIds) {
    const prop = tagOptions.value.props.find((item) => item.id === propId)
    if (prop) {
      store.addTagToActiveShot('prop', prop)
    }
  }
}

const confirmInsertShot = (): void => {
  if (!pendingInsertAfterShotId.value) {
    return
  }

  store.insertBlankShotAfter(pendingInsertAfterShotId.value)
  store.updateActiveShotPrompt(insertDraft.value.prompt)
  store.updateActiveShotStyle(insertDraft.value.style)
  store.updateActiveShotRatio(insertDraft.value.ratio)
  applyInsertDraftTags()
  resetInsertMode()
  showToast('新镜头已插入', 'success')
}

const toggleStoryboardReviewed = (id: string): void => {
  store.toggleStoryboardReviewed(id)
}

const requestDeleteShot = (id: string): void => {
  pendingDeleteShotId.value = id
  deleteConfirmOpen.value = true
}

const deleteShot = (id: string): void => {
  requestDeleteShot(id)
}

const confirmDelete = (): void => {
  const shotId = pendingDeleteShotId.value
  if (!shotId) {
    deleteConfirmOpen.value = false
    return
  }

  store.deleteShot(shotId)
  pendingDeleteShotId.value = null
  deleteConfirmOpen.value = false
  showToast(buildStoryboardDeleteToastMessage(), 'success')
}

const cancelDeleteConfirm = (): void => {
  pendingDeleteShotId.value = null
  deleteConfirmOpen.value = false
}

const toggleLock = (id: string): void => {
  store.toggleLock(id)
}

const toggleHidden = (id: string): void => {
  store.toggleHidden(id)
  const target = shots.value.find((shot) => shot.id === id)
  showToast(target?.isHidden ? '当前镜头已隐藏，不会进入下一步' : '当前镜头已恢复显示', 'info')
}

const selectReference = async (id: string): Promise<void> => {
  const shot = currentShot.value
  if (!shot) {
    return
  }

  if (shot.isLocked) {
    showToast('当前镜头已锁定，无法应用参考图', 'error')
    return
  }

  await store.applyReferenceImageToShot(shot.id, id)
  showToast('参考图已应用到当前分镜', 'success')
}

const toggleReferenceRail = (collapsed: boolean): void => {
  isReferenceCollapsed.value = collapsed
}

const toggleTimelineCollapse = (): void => {
  isTimelineCollapsed.value = !isTimelineCollapsed.value
}

const togglePromptPanel = (): void => {
  isPromptCollapsed.value = !isPromptCollapsed.value
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedShotIds.value = []
}

const toggleSelectAllShots = (): void => {
  selectedShotIds.value = isAllShotsSelected.value ? [] : shots.value.map((shot) => shot.id)
}

const handleBatchTrigger = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }

  if (shots.value.length === 0) {
    showToast('当前没有可批量操作的分镜', 'info')
    return
  }

  batchMode.value = true
}

const handleBatchGenerate = async (): Promise<void> => {
  if (submitting.value || batchGenerating.value) {
    return
  }

  const availability = batchAvailability.value

  if (availability.selectedCount === 0) {
    showToast('请先选择至少一个分镜', 'error')
    return
  }

  if (!availability.canGenerate) {
    showToast(availability.disabledReason || '当前选择中没有可生成的分镜', 'info')
    return
  }

  batchDialogOpen.value = true
}

const closeBatchGenerateDialog = (): void => {
  batchDialogOpen.value = false
}

const buildBatchGenerateSummary = (input: {
  successCount: number
  failedCount: number
  skippedCount: number
}): { message: string; tone: 'success' | 'error' | 'info' } => {
  if (input.successCount > 0 && input.failedCount === 0 && input.skippedCount === 0) {
    return {
      message: `已完成 ${input.successCount} 个分镜的批量生成`,
      tone: 'success',
    }
  }

  if (input.successCount === 0 && input.failedCount === 0 && input.skippedCount > 0) {
    return {
      message: `当前选择中没有可生成的分镜，已跳过 ${input.skippedCount} 个`,
      tone: 'info',
    }
  }

  if (input.successCount === 0) {
    return {
      message: '分镜批量生成失败，请调整提示词后重试',
      tone: 'error',
    }
  }

  const fragments = [`成功 ${input.successCount} 个`]
  if (input.failedCount > 0) {
    fragments.push(`失败 ${input.failedCount} 个`)
  }
  if (input.skippedCount > 0) {
    fragments.push(`跳过 ${input.skippedCount} 个`)
  }

  return {
    message: `批量生成完成：${fragments.join('，')}`,
    tone: input.failedCount > 0 ? 'error' : 'success',
  }
}

const runBatchGenerateNow = async (): Promise<void> => {
  const availability = batchAvailability.value
  const targetIds = availability.targetIds
  const skippedCount = availability.unavailableCount
  if (targetIds.length === 0) {
    showToast(availability.disabledReason || '当前选择中没有可生成的分镜', 'info')
    return
  }

  batchGenerating.value = true

  try {
    store.markShotsGenerating(targetIds)

    let successCount = 0
    let failedCount = 0

    for (const id of targetIds) {
      try {
        await store.generateShotById(id)
        successCount += 1
      } catch {
        failedCount += 1
      }
    }

    const summary = buildBatchGenerateSummary({
      successCount,
      failedCount,
      skippedCount,
    })
    showToast(summary.message, summary.tone)
  } finally {
    batchGenerating.value = false
  }
}

const confirmBatchGenerate = async ({
  mode,
  scheduledDate,
  scheduledTime,
}: {
  mode: 'immediate' | 'scheduled'
  scheduledDate: string | null
  scheduledTime: string | null
}): Promise<void> => {
  batchGenerationMode.value = mode
  batchScheduledDate.value = scheduledDate ?? ''
  batchScheduledTime.value = scheduledTime ?? '08:00'
  batchDialogOpen.value = false

  if (mode === 'scheduled') {
    if (!scheduledDate || !scheduledTime) {
      showToast('请先选择完整的定时生成时间', 'error')
      return
    }

    showToast(`已设置 ${scheduledDate} ${scheduledTime} 的批量生成任务`, 'success')
    return
  }

  await runBatchGenerateNow()
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistStoryboardDraft()
  if (!saved || !editorStore.draft) {
    return
  }

  const payload = buildScopedProjectArtifact(projectId.value, editorStore.draft, 'storyboard')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildScopedProjectExportFileName(projectId.value)
  link.click()
  URL.revokeObjectURL(objectUrl)

  showToast('分镜已保存并导出', 'success')
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

const closePreviewDialog = (): void => {
  previewDialogOpen.value = false
}

const openPreviewDialog =
  (mode: 'view' | 'zoom') =>
  (): void => {
    if (!canOpenStoryboardImageTools(currentShot.value?.imageUrl)) {
      showToast('当前分镜暂无可查看的图片', 'error')
      return
    }

    previewDialogMode.value = mode
    previewDialogOpen.value = true
  }

const closeEditDialog = (): void => {
  if (editingImage.value) {
    return
  }

  editDialogOpen.value = false
}

const openEditDialog = (): void => {
  if (currentShot.value?.isLocked) {
    showToast('当前镜头已锁定，无法继续编辑', 'error')
    return
  }

  if (!canOpenStoryboardImageTools(currentShot.value?.imageUrl)) {
    showToast('请先生成或上传分镜图后再进行编辑', 'error')
    return
  }

  editDialogOpen.value = true
}

const upscaleShot = async (): Promise<void> => {
  const shot = currentShot.value
  if (!shot) {
    return
  }

  if (!shot.imageUrl) {
    showToast('请先生成或上传分镜图后再进行放大', 'error')
    return
  }

  try {
    await store.upscaleShotById(shot.id)
    showToast('当前分镜已完成高清放大', 'success')
  } catch (error) {
    if (error instanceof Error && error.message === API_ERROR_CODES.storyboardUpscaleImageRequired) {
      showToast('请先生成或上传分镜图后再进行放大', 'error')
      return
    }

    showToast('分镜放大失败，请稍后再试', 'error')
  }
}

const applyImageEdit = async ({
  prompt,
  selection,
}: {
  prompt: string
  selection: StoryboardSelectionRect
}): Promise<void> => {
  const shot = currentShot.value
  if (!shot?.imageUrl) {
    showToast('当前分镜暂无可编辑的图片', 'error')
    return
  }

  editingImage.value = true
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    const result = buildStoryboardEditedImage({
      sourceUrl: shot.imageUrl,
      prompt,
      title: shot.title,
      selection,
    })
    await store.applyEditedImageToShot(shot.id, {
      imageUrl: result.imageUrl,
      prompt,
      selection,
    })
    editDialogOpen.value = false
    showToast('编辑结果已应用到当前分镜', 'success')
  } catch {
    showToast('分镜编辑失败，请稍后再试', 'error')
  } finally {
    editingImage.value = false
  }
}

const triggerUploadForShot = (id: string): void => {
  const shot = shots.value.find((item) => item.id === id)
  if (shot?.isLocked) {
    showToast('当前镜头已锁定，无法上传新图', 'error')
    return
  }

  pendingUploadShotId.value = id
  store.selectShot(id)
  uploadInputRef.value?.click()
}

const handleUploadFileChange = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const shotId = pendingUploadShotId.value

  if (!file || !shotId) {
    if (input) {
      input.value = ''
    }
    pendingUploadShotId.value = null
    return
  }

  try {
    const imageUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('UPLOAD_READ_FAILED'))
      reader.readAsDataURL(file)
    })

    await store.uploadShotImage(shotId, imageUrl)
    showToast('分镜图片已上传', 'success')
  } catch {
    showToast('图片上传失败，请稍后再试', 'error')
  } finally {
    input.value = ''
    pendingUploadShotId.value = null
  }
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

const goVideoStep = async (): Promise<void> => {
  const validation = validateEditorAdvance('storyboardToVideo', {
    shots: shots.value,
    storyboardMode: storyboardMode.value,
  })
  if (!validation.ok) {
    if (validation.shotId) {
      store.selectShot(validation.shotId)
      exitBatchMode()
      resetInsertMode()
    }
    showToast(validation.message, 'error')
    return
  }

  const saved = await persistStoryboardDraft()
  if (!saved) {
    return
  }

  try {
    if (projectId.value) {
      await storyboardWorkflowService.confirmStoryboard(projectId.value)
      await projectStore.updateProjectStep(projectId.value, validation.nextStep)
    }
  } catch {
    showToast('分镜确认失败，请稍后再试', 'error')
    return
  }

  showToast(validation.successMessage, 'success')
  await router.push({
    name: validation.routeName,
    params: route.params,
  })
}
</script>