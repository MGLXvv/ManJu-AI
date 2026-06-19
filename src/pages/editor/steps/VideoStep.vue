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
            :action-disabled="isVideoBatchActionDisabled"
            @exit="exitBatchMode"
            @toggle-primary="toggleSelectAllShots"
            @action="openBatchGenerateDialog"
          />

          <div class="storyboard-main-card__divider"></div>

          <div class="storyboard-main-card__body video-main-card__body">
            <VideoPromptPanel
              v-if="currentShot"
              :shot="currentShot"
              :available-characters="availableCharacters"
              :optimizing-video-prompt="optimizingVideoPrompt"
              :optimizing-dialogue="optimizingDialogue"
              @update-video-prompt="store.updateActiveShotVideoPrompt"
              @update-dialogue="store.updateActiveShotDialogue"
              @optimize-video-prompt="optimizeVideoPrompt"
              @optimize-dialogue="optimizeDialogue"
              @update-duration="store.updateActiveShotDuration"
              @update-voice="updateVoice"
              @remove-character="removeCharacter"
              @add-character="addCharacter"
              @upload-attachments="uploadAttachments"
              @remove-attachment="removeAttachment"
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
        @upload="triggerUploadForShot"
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

    <Teleport to="body">
      <Transition name="storyboard-batch-generate-dialog-fade">
        <div v-if="batchGenerateDialogOpen" class="storyboard-batch-generate-dialog__mask" @click="closeBatchGenerateDialog">
          <section class="storyboard-batch-generate-dialog" role="dialog" aria-modal="true" @click.stop>
            <header class="storyboard-batch-generate-dialog__header">
              <h3>批量生成</h3>
              <button type="button" class="storyboard-batch-generate-dialog__close" @click="closeBatchGenerateDialog">×</button>
            </header>

            <div class="storyboard-batch-generate-dialog__body">
              <div class="storyboard-batch-generate-dialog__mode-row">
                <button
                  type="button"
                  class="storyboard-batch-generate-dialog__mode-btn"
                  :class="{ 'is-active': batchGenerateMode === 'immediate' }"
                  @click="batchGenerateMode = 'immediate'"
                >
                  <span>立即生成</span>
                  <small>立刻生成已选视频</small>
                </button>
                <button
                  type="button"
                  class="storyboard-batch-generate-dialog__mode-btn"
                  :class="{ 'is-active': batchGenerateMode === 'scheduled' }"
                  @click="batchGenerateMode = 'scheduled'"
                >
                  <span>定时生成</span>
                  <small>按预设时间自动开始</small>
                </button>
              </div>

              <div v-if="batchGenerateMode === 'scheduled'" class="storyboard-batch-generate-dialog__schedule">
                <span class="storyboard-batch-generate-dialog__label">选择生成时间</span>
                <div class="storyboard-batch-generate-dialog__schedule-row">
                  <select v-model="batchGenerateDay">
                    <option value="today">今天</option>
                    <option value="tomorrow">明天</option>
                  </select>
                  <select v-model="batchGenerateTime">
                    <option value="08:00">08:00</option>
                    <option value="12:00">12:00</option>
                    <option value="18:00">18:00</option>
                    <option value="21:00">21:00</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="storyboard-batch-generate-dialog__actions">
              <button type="button" class="storyboard-batch-generate-dialog__confirm" @click="confirmBatchGenerate">确定</button>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>

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
    accept="video/mp4,video/webm,video/ogg"
    @change="handleUploadFileChange"
  />
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
import {
  canBatchGenerateVideoShot,
  resolveVideoBatchAvailability,
  resolveVideoBatchGenerateTargets,
} from '@/features/editor/videoBatchState'
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
import {
  buildVideoBatchGenerateMessage,
  buildVideoGenerateErrorMessage,
} from '@/features/editor/videoGenerationState'
import { buildScopedProjectArtifact, buildScopedProjectExportFileName } from '@/features/editor/editorExportScopeState'
import { videoPromptService } from '@/services/generation'
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
const availableCharacters = computed(() => store.tagOptions.characters)
const batchMode = ref(false)
const selectedShotIds = ref<string[]>([])
const submitting = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
const batchGenerateDialogOpen = ref(false)
const batchGenerateMode = ref<'immediate' | 'scheduled'>('immediate')
const batchGenerateDay = ref<'today' | 'tomorrow'>('today')
const batchGenerateTime = ref('08:00')
const batchGenerating = ref(false)
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const pendingDeleteShotId = ref<string | null>(null)
const bypassLeaveGuard = ref(false)
const lastSavedSnapshot = ref('')
const previewDialogOpen = ref(false)
const previewDialogMode = ref<'view' | 'zoom'>('view')
const editDialogOpen = ref(false)
const editingImage = ref(false)
const optimizingVideoPrompt = ref(false)
const optimizingDialogue = ref(false)
const pendingUploadShotId = ref<string | null>(null)
const uploadInputRef = ref<HTMLInputElement | null>(null)
let scheduledBatchGenerateTimer: number | null = null

const videoBatchAvailability = computed(() =>
  resolveVideoBatchAvailability({
    shots: shots.value,
    selectedShotIds: selectedShotIds.value,
    overwriteGenerated: false,
  }),
)
const isVideoBatchActionDisabled = computed(
  () => selectedShotIds.value.length === 0 || batchGenerating.value || submitting.value,
)
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
      await store.loadDefaults()
      lastSavedSnapshot.value = buildStoryboardDraftSnapshot(store.shots)
      return
    }

    await editorStore.loadDraft(nextProjectId)
    const nextTagOptions = resolveStoryboardTagOptions(editorStore.draft, store.tagOptions)
    store.setTagOptions(nextTagOptions)

    if (editorStore.draft?.shots.length) {
      store.replaceShots(resolveStoryboardShots(editorStore.draft.shots, nextTagOptions))
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
  const shot = currentShot.value
  if (!shot) {
    showToast('当前没有可生成视频的分镜', 'error')
    return
  }

  if (shot.isHidden) {
    showToast('当前镜头已隐藏，无法生成视频', 'error')
    return
  }

  if (shot.isLocked) {
    showToast('当前镜头已锁定，无法生成视频', 'error')
    return
  }

  if (!(shot.imageUrl ?? '').trim()) {
    showToast('请先生成或上传分镜图后再生成视频', 'error')
    return
  }

  try {
    await store.generateActiveVideo()
    showToast('视频镜头已生成', 'success')
  } catch (error) {
    showToast(buildVideoGenerateErrorMessage(error), 'error')
  }
}

const optimizeVideoPrompt = async (): Promise<void> => {
  const shot = currentShot.value
  if (!shot) return

  optimizingVideoPrompt.value = true
  try {
    const result = await videoPromptService.optimizeVideoPrompt({
      projectId: projectId.value,
      shotId: shot.id,
      prompt: shot.videoPrompt ?? shot.prompt ?? '',
    })
    store.updateActiveShotVideoPrompt(result.value)
    showToast('视频提示词已优化', 'success')
  } catch (error) {
    showToast(buildVideoGenerateErrorMessage(error), 'error')
  } finally {
    optimizingVideoPrompt.value = false
  }
}

const optimizeDialogue = async (): Promise<void> => {
  const shot = currentShot.value
  if (!shot) return

  optimizingDialogue.value = true
  try {
    const result = await videoPromptService.optimizeDialogue({
      projectId: projectId.value,
      shotId: shot.id,
      dialogue: shot.dialogue ?? '',
    })
    store.updateActiveShotDialogue(result.value)
    showToast('对白已优化', 'success')
  } catch (error) {
    showToast(buildVideoGenerateErrorMessage(error), 'error')
  } finally {
    optimizingDialogue.value = false
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

const updateVoice = ({ assignmentId, voice }: { assignmentId: string; voice: string }): void => {
  store.updateActiveShotVoice(assignmentId, voice)
}

const addCharacter = ({
  characterId,
  voice,
  afterId,
}: {
  characterId: string
  voice: string
  afterId?: string | null
}): void => {
  const target = availableCharacters.value.find((item) => item.id === characterId)
  if (!target) {
    showToast('请选择有效角色后再保存', 'error')
    return
  }

  const shot = currentShot.value
  if (!shot) return

  if (!shot.characters.some((item) => item.id === target.id)) {
    store.addTagToActiveShot('character', target)
  }

  store.addActiveShotVoiceAssignment({
    characterId,
    voice,
    afterId,
  })
  showToast('角色音色已添加', 'success')
}

const removeCharacter = (assignmentId: string): void => {
  store.removeActiveShotVoice(assignmentId)
  showToast('角色音色已删除', 'success')
}

const uploadAttachments = (files: File[]): void => {
  for (const file of files) {
    store.addActiveShotAttachment({
      name: file.name,
      size: file.size,
      type: file.type,
    })
  }
  showToast(`已添加 ${files.length} 个附件`, 'success')
}

const removeAttachment = (attachmentId: string): void => {
  store.removeActiveShotAttachment(attachmentId)
  showToast('附件已移除', 'success')
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
    showToast('当前没有可生成视频的分镜', 'info')
    return
  }

  batchMode.value = true
}

const runBatchGenerate = async (ids = selectedShotIds.value): Promise<void> => {
  if (batchGenerating.value) {
    return
  }

  const availability = resolveVideoBatchAvailability({
    shots: shots.value,
    selectedShotIds: ids,
    overwriteGenerated: false,
  })
  const targets = resolveVideoBatchGenerateTargets(shots.value, ids)
  if (targets.length === 0) {
    showToast(availability.disabledReason || '当前选择中没有可生成视频的分镜', 'info')
    return
  }

  batchGenerating.value = true
  try {
    const results = await Promise.allSettled(targets.map((shot) => store.generateVideoById(shot.id)))
    const successCount = results.filter((item) => item.status === 'fulfilled').length
    const failedCount = results.length - successCount

    showToast(buildVideoBatchGenerateMessage({ successCount, failedCount }), failedCount > 0 ? 'error' : 'success')
    selectedShotIds.value = selectedShotIds.value.filter((id) =>
      shots.value.some((shot) => shot.id === id && canBatchGenerateVideoShot(shot)),
    )
  } finally {
    batchGenerating.value = false
  }
}

const openBatchGenerateDialog = (): void => {
  const availability = videoBatchAvailability.value
  if (batchGenerating.value || submitting.value) {
    return
  }
  if (availability.selectedCount === 0) {
    showToast('请先选择至少一个分镜', 'error')
    return
  }
  if (!availability.canGenerate) {
    showToast(availability.disabledReason || '当前选择中没有可生成视频的分镜', 'info')
    return
  }
  batchGenerateDialogOpen.value = true
}

const closeBatchGenerateDialog = (): void => {
  batchGenerateDialogOpen.value = false
}

const confirmBatchGenerate = async (): Promise<void> => {
  if (batchGenerating.value) {
    return
  }

  batchGenerateDialogOpen.value = false

  if (batchGenerateMode.value === 'scheduled') {
    const scheduledIds = videoBatchAvailability.value.targetIds
    if (scheduledIds.length === 0) {
      showToast(videoBatchAvailability.value.disabledReason || '当前选择中没有可生成视频的分镜', 'info')
      return
    }
    if (scheduledBatchGenerateTimer !== null) {
      window.clearTimeout(scheduledBatchGenerateTimer)
    }
    showToast(
      `已安排${batchGenerateDay.value === 'today' ? '今天' : '明天'} ${batchGenerateTime.value} 自动生成 ${scheduledIds.length} 个视频`,
      'success',
    )
    scheduledBatchGenerateTimer = window.setTimeout(() => {
      scheduledBatchGenerateTimer = null
      void runBatchGenerate(scheduledIds)
    }, 800)
    return
  }

  await runBatchGenerate()
}

const handleSaveExport = async (): Promise<void> => {
  const saved = await persistVideoDraft()
  if (!saved || !editorStore.draft) {
    return
  }

  const payload = buildScopedProjectArtifact(projectId.value, editorStore.draft, 'video')
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildScopedProjectExportFileName(projectId.value)
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
  if (scheduledBatchGenerateTimer !== null) {
    window.clearTimeout(scheduledBatchGenerateTimer)
    scheduledBatchGenerateTimer = null
  }
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
    await store.applyEditedImageToShot(shot.id, {
      imageUrl: result.imageUrl,
      prompt,
      selection,
    })
    editDialogOpen.value = false
    showToast('视频封面编辑结果已应用', 'success')
  } catch {
    showToast('视频封面编辑失败，请稍后再试', 'error')
  } finally {
    editingImage.value = false
  }
}

const triggerUploadForShot = (id: string): void => {
  const shot = shots.value.find((item) => item.id === id)
  if (shot?.isLocked) {
    showToast('当前镜头已锁定，无法上传视频', 'error')
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
    input.value = ''
    pendingUploadShotId.value = null
    return
  }

  try {
    const videoUrl = URL.createObjectURL(file)
    await store.uploadShotVideo(shotId, videoUrl)
    showToast('视频文件已上传', 'success')
  } catch {
    showToast('视频上传失败，请稍后再试', 'error')
  } finally {
    input.value = ''
    pendingUploadShotId.value = null
  }
}

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
