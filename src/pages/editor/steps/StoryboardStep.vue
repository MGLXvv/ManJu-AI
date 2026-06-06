<template>
  <section class="storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="storyboard-layout" :class="{ 'is-reference-collapsed': isReferenceCollapsed }">
      <div class="storyboard-layout__main">
        <section class="storyboard-main-card" :class="{ 'has-batch-toolbar': batchMode }">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            :batch-label="batchMode ? '退出批量' : '批量操作'"
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
            :action-disabled="selectedShotIds.length === 0"
            @exit="exitBatchMode"
            @toggle-primary="toggleSelectAllShots"
            @action="handleBatchGenerate"
          />

          <div class="storyboard-main-card__divider"></div>

          <div class="storyboard-main-card__body">
            <StoryboardPromptPanel
              v-if="currentShot"
              :shot="currentShot"
              :tag-options="tagOptions"
              :style-options="styleOptions"
              @add-tag="handleAddTag"
              @remove-tag="handleRemoveTag"
              @update-prompt="updatePrompt"
              @update-style="updateStyle"
              @update-ratio="updateRatio"
              @generate-shot="generateShot"
            />

            <StoryboardPreviewPanel
              v-if="currentShot"
              :shot="currentShot"
              @lock-shot="toggleLock"
              @copy-shot="copyShot"
              @delete-shot="deleteShot"
              @edit-shot="openEditDialog"
              @view-shot="openPreviewDialog('view')"
              @zoom-shot="openPreviewDialog('zoom')"
            />
          </div>
        </section>
      </div>

      <StoryboardReferenceRail
        class="storyboard-layout__reference"
        :images="currentReferenceImages"
        :collapsed="isReferenceCollapsed"
        :active-image-url="currentShot?.imageUrl ?? ''"
        @select="selectReference"
        @toggle-collapse="toggleReferenceRail"
      />

      <StoryboardTimeline
        class="storyboard-layout__timeline"
        :shots="shots"
        :active-shot-id="activeShotId"
        :batch-mode="batchMode"
        :batch-selected-ids="selectedShotIds"
        @select="handleTimelineSelect"
        @upload="triggerUploadForShot"
        @copy="copyShot"
        @delete="deleteShot"
        @favorite="toggleFavorite"
        @create="createBlankShot"
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
import StoryboardImageEditDialog from '@/components/editor/storyboard/StoryboardImageEditDialog.vue'
import StoryboardImagePreviewDialog from '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue'
import StoryboardPreviewPanel from '@/components/editor/storyboard/StoryboardPreviewPanel.vue'
import StoryboardPromptPanel from '@/components/editor/storyboard/StoryboardPromptPanel.vue'
import StoryboardReferenceRail from '@/components/editor/storyboard/StoryboardReferenceRail.vue'
import StoryboardTimeline from '@/components/editor/storyboard/StoryboardTimeline.vue'
import StoryboardTopActions from '@/components/editor/storyboard/StoryboardTopActions.vue'
import { buildStoryboardDeleteDialogCopy, buildStoryboardDeleteToastMessage } from '@/features/editor/storyboardDeleteState'
import { buildStoryboardDraftSnapshot } from '@/features/editor/storyboardDirtyState'
import { resolveStoryboardTagOptions } from '@/features/editor/storyboardDraftState'
import { buildStoryboardGenerateErrorMessage } from '@/features/editor/storyboardGenerationState'
import { buildStoryboardLeaveDialogCopy, shouldInterceptStoryboardLeave } from '@/features/editor/storyboardLeaveConfirmState'
import {
  buildStoryboardExportFileName,
  buildStoryboardExportPayload,
  resolveStoryboardShots,
} from '@/features/editor/storyboardPersistState'
import {
  buildStoryboardEditedImage,
  buildStoryboardSaveState,
  canOpenStoryboardImageTools,
  type StoryboardSelectionRect,
} from '@/features/editor/storyboardPreviewState'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildProjectArtifactEnvelope } from '@/features/shared/projectArtifactState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useStoryboardStore } from '@/stores/storyboard'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { StoryboardTagType } from '@/types/storyboard'

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
const batchMode = ref(false)
const selectedShotIds = ref<string[]>([])
const submitting = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
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

const isAllShotsSelected = computed(
  () => shots.value.length > 0 && shots.value.every((shot) => selectedShotIds.value.includes(shot.id)),
)
const currentSnapshot = computed(() => buildStoryboardDraftSnapshot(shots.value))
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const saveState = computed(() => buildStoryboardSaveState({ submitting: submitting.value, isDirty: isDirty.value }))
const leaveDialogCopy = buildStoryboardLeaveDialogCopy()
const deleteDialogCopy = buildStoryboardDeleteDialogCopy()
const previewDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const previewDialogTitle = computed(() => currentShot.value?.title ?? '分镜预览')
const editDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const editDialogTitle = computed(() => currentShot.value?.title ?? '当前分镜')

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      store.resetShots()
      lastSavedSnapshot.value = buildStoryboardDraftSnapshot(store.shots)
      return
    }

    await editorStore.loadDraft(nextProjectId)
    const nextTagOptions = resolveStoryboardTagOptions(editorStore.draft, tagOptions.value)
    store.setTagOptions(nextTagOptions)

    if (editorStore.draft?.shots.length) {
      store.replaceShots(resolveStoryboardShots(editorStore.draft.shots, nextTagOptions))
    } else {
      store.resetShots()
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
  },
  { immediate: true },
)

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
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
    await editorStore.saveDraft()
    markSaved()
    return true
  } catch {
    showToast('分镜保存失败，请稍后再试', 'error')
    return false
  } finally {
    submitting.value = false
  }
}

const selectShot = (id: string): void => {
  store.selectShot(id)
}

const handleTimelineSelect = (id: string): void => {
  if (batchMode.value) {
    selectedShotIds.value = selectedShotIds.value.includes(id)
      ? selectedShotIds.value.filter((item) => item !== id)
      : [...selectedShotIds.value, id]
    return
  }

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

const generateShot = async (): Promise<void> => {
  try {
    await store.generateActiveShot()
    showToast('分镜已生成', 'success')
  } catch (error) {
    showToast(buildStoryboardGenerateErrorMessage(error), 'error')
  }
}

const createBlankShot = (): void => {
  store.createBlankShot()
}

const copyShot = (id: string): void => {
  store.copyShot(id)
  showToast('分镜已复制', 'success')
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

const toggleFavorite = (id: string): void => {
  store.toggleFavorite(id)
}

const toggleLock = (id: string): void => {
  store.toggleLock(id)
}

const selectReference = (id: string): void => {
  const shot = currentShot.value
  if (!shot) {
    return
  }

  store.applyReferenceImageToShot(shot.id, id)
  showToast('参考图已应用到当前分镜', 'success')
}

const toggleReferenceRail = (collapsed: boolean): void => {
  isReferenceCollapsed.value = collapsed
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

  batchMode.value = true
}

const handleBatchGenerate = async (): Promise<void> => {
  if (selectedShotIds.value.length === 0) return

  let successCount = 0
  let failedCount = 0

  for (const id of selectedShotIds.value) {
    try {
      await store.generateShotById(id)
      successCount += 1
    } catch {
      failedCount += 1
    }
  }

  if (successCount > 0 && failedCount === 0) {
    showToast(`已完成 ${successCount} 个分镜的批量生成`, 'success')
    return
  }

  if (successCount === 0) {
    showToast('分镜批量生成失败，请调整提示词后重试', 'error')
    return
  }

  showToast(`批量生成完成：成功 ${successCount} 个，失败 ${failedCount} 个`, 'error')
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistStoryboardDraft()
  if (!saved) {
    return
  }

  const payload = buildProjectArtifactEnvelope({
    artifact: 'storyboard',
    projectId: projectId.value || 'storyboard',
    payload: buildStoryboardExportPayload(shots.value),
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildStoryboardExportFileName(projectId.value)
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
  if (!canOpenStoryboardImageTools(currentShot.value?.imageUrl)) {
    showToast('请先生成或上传分镜图后再进行编辑', 'error')
    return
  }

  editDialogOpen.value = true
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
    store.applyEditedImageToShot(shot.id, result.imageUrl)
    editDialogOpen.value = false
    showToast('编辑结果已应用到当前分镜', 'success')
  } finally {
    editingImage.value = false
  }
}

const triggerUploadForShot = (id: string): void => {
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

    store.uploadShotImage(shotId, imageUrl)
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
  const validation = validateEditorAdvance('storyboardToVideo', { shots: shots.value })
  if (!validation.ok) {
    showToast(validation.message, 'error')
    return
  }

  const saved = await persistStoryboardDraft()
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
