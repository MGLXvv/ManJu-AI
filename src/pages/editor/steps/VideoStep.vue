<template>
  <section class="video-step storyboard-step">
    <div class="storyboard-step__bg" aria-hidden="true"></div>

    <div class="video-layout">
      <div class="video-layout__main">
        <section class="storyboard-main-card video-main-card" :class="{ 'has-batch-toolbar': batchMode }">
          <StoryboardTopActions
            class="storyboard-main-card__actions"
            next-label="进入配音"
            :batch-label="batchMode ? '退出批量' : '批量操作'"
            :save-state-label="saveState.label"
            :save-state-tone="saveState.tone"
            @batch-generate="handleBatchTrigger"
            @save-export="handleSaveExport"
            @next="goDubbingStep"
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

          <div class="storyboard-main-card__body video-main-card__body">
            <VideoPromptPanel
              v-if="currentShot"
              :shot="currentShot"
              @update-video-prompt="store.updateActiveShotVideoPrompt"
              @update-dialogue="store.updateActiveShotDialogue"
              @update-duration="store.updateActiveShotDuration"
              @update-voice="updateVoice"
              @remove-character="removeCharacter"
              @generate-video="generateShot"
            />

            <VideoPreviewPanel
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

      <StoryboardTimeline
        class="video-layout__timeline"
        :shots="shots"
        :active-shot-id="activeShotId"
        :batch-mode="batchMode"
        :batch-selected-ids="selectedShotIds"
        @select="handleTimelineSelect"
        @upload="noop"
        @copy="copyShot"
        @delete="deleteShot"
        @favorite="toggleFavorite"
        @create="createBlankShot"
      />
    </div>

    <AppConfirmDialog
      :open="leaveConfirmOpen"
      title="当前视频内容尚未保存"
      description="离开后未保存的视频提示词、对白和时长设置会丢失。"
      confirm-text="仍要离开"
      cancel-text="继续编辑"
      confirm-tone="primary"
      @confirm="confirmLeave"
      @cancel="cancelLeaveConfirm"
    />

    <AppConfirmDialog
      :open="deleteConfirmOpen"
      title="确定删除当前视频镜头吗？"
      confirm-text="删除"
      cancel-text="取消"
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
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalizedLoadedGeneric, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import StoryboardImageEditDialog from '@/components/editor/storyboard/StoryboardImageEditDialog.vue'
import StoryboardImagePreviewDialog from '@/components/editor/storyboard/StoryboardImagePreviewDialog.vue'
import StoryboardTimeline from '@/components/editor/storyboard/StoryboardTimeline.vue'
import StoryboardTopActions from '@/components/editor/storyboard/StoryboardTopActions.vue'
import VideoPreviewPanel from '@/components/editor/video/VideoPreviewPanel.vue'
import VideoPromptPanel from '@/components/editor/video/VideoPromptPanel.vue'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildStoryboardDraftSnapshot } from '@/features/editor/storyboardDirtyState'
import { resolveStoryboardTagOptions } from '@/features/editor/storyboardDraftState'
import { shouldInterceptStoryboardLeave } from '@/features/editor/storyboardLeaveConfirmState'
import { resolveStoryboardShots } from '@/features/editor/storyboardPersistState'
import {
  buildStoryboardEditedImage,
  buildStoryboardSaveState,
  canOpenStoryboardImageTools,
  type StoryboardSelectionRect,
} from '@/features/editor/storyboardPreviewState'
import { buildVideoBatchGenerateMessage, buildVideoGenerateErrorMessage } from '@/features/editor/videoGenerationState'
import { buildVideoExportFileName } from '@/features/editor/videoPersistState'
import { buildProjectArtifactEnvelope } from '@/features/shared/projectArtifactState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { useStoryboardStore } from '@/stores/storyboard'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

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
const currentShot = computed(() => activeShot.value ?? shots.value[0] ?? null)
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

const isAllShotsSelected = computed(
  () => shots.value.length > 0 && shots.value.every((shot) => selectedShotIds.value.includes(shot.id)),
)
const currentSnapshot = computed(() => buildStoryboardDraftSnapshot(shots.value))
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const saveState = computed(() => buildStoryboardSaveState({ submitting: submitting.value, isDirty: isDirty.value }))
const previewDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const previewDialogTitle = computed(() => currentShot.value?.title ?? '视频预览')
const editDialogImageUrl = computed(() => currentShot.value?.imageUrl ?? '')
const editDialogTitle = computed(() => currentShot.value?.title ?? '当前视频镜头')

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      store.resetShots()
      lastSavedSnapshot.value = buildStoryboardDraftSnapshot(store.shots)
      return
    }

    await editorStore.loadDraft(nextProjectId)
    const nextTagOptions = resolveStoryboardTagOptions(editorStore.draft, store.tagOptions)
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
  },
  { immediate: true },
)

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const persistVideoDraft = async (): Promise<boolean> => {
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
    showToast('视频保存失败，请稍后再试', 'error')
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

const generateShot = async (): Promise<void> => {
  try {
    await store.generateActiveVideo()
    showToast('视频镜头已生成', 'success')
  } catch (error) {
    showToast(buildVideoGenerateErrorMessage(error), 'error')
  }
}

const createBlankShot = (): void => {
  store.createBlankShot()
}

const copyShot = (id: string): void => {
  store.copyShot(id)
  showToast('视频镜头已复制', 'success')
}

const deleteShot = (id: string): void => {
  pendingDeleteShotId.value = id
  deleteConfirmOpen.value = true
}

const toggleFavorite = (id: string): void => {
  store.toggleFavorite(id)
}

const toggleLock = (id: string): void => {
  store.toggleLock(id)
}

const updateVoice = ({ characterId, voice }: { characterId: string; voice: string }): void => {
  store.updateActiveShotVoice(characterId, voice)
}

const removeCharacter = (characterId: string): void => {
  store.removeTagFromActiveShot('character', characterId)
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
      await store.generateVideoById(id)
      successCount += 1
    } catch {
      failedCount += 1
    }
  }

  showToast(buildVideoBatchGenerateMessage({ successCount, failedCount }), failedCount > 0 ? 'error' : 'success')
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistVideoDraft()
  if (!saved) {
    return
  }

  const payload = buildProjectArtifactEnvelope({
    artifact: 'video',
    projectId: projectId.value || 'video',
    payload: {
      exportedAt: new Date().toISOString(),
      shots: editorStore.draft?.shots ?? [],
    },
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildVideoExportFileName(projectId.value)
  link.click()
  URL.revokeObjectURL(objectUrl)

  showToast('视频已保存并导出', 'success')
}

const cancelLeaveConfirm = (): void => {
  leaveConfirmOpen.value = false
  pendingLeaveTarget.value = null
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
  showToast('视频镜头已删除', 'success')
}

const cancelDeleteConfirm = (): void => {
  pendingDeleteShotId.value = null
  deleteConfirmOpen.value = false
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

const closePreviewDialog = (): void => {
  previewDialogOpen.value = false
}

const openPreviewDialog =
  (mode: 'view' | 'zoom') =>
  (): void => {
    if (!canOpenStoryboardImageTools(currentShot.value?.imageUrl)) {
      showToast('当前视频镜头暂无可查看的封面图', 'error')
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
    showToast('请先生成或上传封面图后再进行编辑', 'error')
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
    showToast('当前视频镜头暂无可编辑的封面图', 'error')
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
    showToast('视频封面编辑结果已应用', 'success')
  } finally {
    editingImage.value = false
  }
}

const noop = (_id?: string): void => {}

const goDubbingStep = async (): Promise<void> => {
  const validation = validateEditorAdvance('videoToDubbing', { shots: shots.value })
  if (!validation.ok) {
    showToast(validation.message, 'error')
    return
  }

  const saved = await persistVideoDraft()
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
