<template>
  <section class="setting-step">
    <div class="setting-step__bg" aria-hidden="true"></div>

    <div class="setting-workbench" :class="{ 'has-batch-toolbar': batchMode }">
      <SettingToolbar
        v-model:keyword="keyword"
        :batch-label="batchMode ? '退出批量' : '批量操作'"
        @add="openCreateModal"
        @batch="handleBatch"
        @save-export="handleSaveExport"
        @next="openGenerationModeDialog"
      />

      <SettingTabs v-model="activeType" :counts="counts" />

      <BatchSelectionToolbar
        v-if="batchMode"
        primary-label="本页全选"
        secondary-label="全部资产"
        :selected-count="selectedBatchIds.length"
        :total-count="assetsStore.assets.length"
        :primary-selected="isFilteredFullySelected"
        :secondary-selected="isAllSelected"
        :actions="batchActions"
        @exit="exitBatchMode"
        @toggle-primary="toggleSelectFiltered"
        @toggle-secondary="toggleSelectAll"
        @action="handleBatchAction"
      />

      <AssetGrid
        :assets="filteredAssets"
        :selected-asset-id="selectedAssetId"
        :batch-mode="batchMode"
        :batch-selected-ids="selectedBatchIds"
        @generate="handleGenerate"
        @upload="handleUpload"
        @select-candidate="handleSelectCandidate"
        @update="handleUpdateAsset"
        @select="handleSelectAsset"
        @toggle-batch="toggleBatchSelection"
        @preview="openPreview"
        @favorite="toggleFavorite"
        @delete="deleteAsset"
      />
    </div>

    <CreateAssetModal v-model:open="createModalOpen" @submit="createAsset" />
    <AssetPreviewModal v-model:open="previewOpen" :asset="previewAsset" />

    <div v-if="generationModeDialogOpen" class="setting-generation-mode-dialog">
      <div class="setting-generation-mode-dialog__overlay" @click="closeGenerationModeDialog"></div>
      <div class="setting-generation-mode-dialog__panel">
        <div class="setting-generation-mode-dialog__header">
          <h2>选择生成方式</h2>
          <p>进入分镜生成前，先确定本次生成模式。</p>
        </div>

        <div class="setting-generation-mode-dialog__options">
          <button
            type="button"
            class="setting-generation-mode-dialog__option"
            :class="{ 'is-active': pendingStoryboardMode === 'multi-param' }"
            @click="pendingStoryboardMode = 'multi-param'"
          >
            <span class="setting-generation-mode-dialog__option-title">多参生成</span>
            <span class="setting-generation-mode-dialog__option-desc">保留更多可调参数，适合精细控制分镜。</span>
          </button>

          <button
            type="button"
            class="setting-generation-mode-dialog__option"
            :class="{ 'is-active': pendingStoryboardMode === 'image' }"
            @click="pendingStoryboardMode = 'image'"
          >
            <span class="setting-generation-mode-dialog__option-title">图片生成</span>
            <span class="setting-generation-mode-dialog__option-desc">以图片生成流程进入，适合快速出图。</span>
          </button>
        </div>

        <div class="setting-generation-mode-dialog__actions">
          <button type="button" class="setting-generation-mode-dialog__cancel" @click="closeGenerationModeDialog">
            取消
          </button>
          <button
            type="button"
            class="setting-generation-mode-dialog__confirm"
            :disabled="submitting"
            @click="confirmGenerationMode"
          >
            {{ submitting ? '进入中' : '确认进入' }}
          </button>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import type { AppIconName } from '@/components/icons/iconRegistry'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import AssetGrid from '@/components/editor/setting/AssetGrid.vue'
import AssetPreviewModal from '@/components/editor/setting/AssetPreviewModal.vue'
import CreateAssetModal from '@/components/editor/setting/CreateAssetModal.vue'
import SettingTabs from '@/components/editor/setting/SettingTabs.vue'
import SettingToolbar from '@/components/editor/setting/SettingToolbar.vue'
import { validateEditorAdvance } from '@/features/editor/editorCompletionState'
import { buildSettingAssetsSnapshot, resolveSettingAssets } from '@/features/editor/settingDraftState'
import { buildSettingDeleteDialogCopy, buildSettingDeleteToastMessage } from '@/features/editor/settingDeleteState'
import { buildSettingLeaveDialogCopy, shouldInterceptSettingLeave } from '@/features/editor/settingLeaveConfirmState'
import { buildSettingExportPayload } from '@/features/editor/settingTransferState'
import { buildProjectArtifactEnvelope, buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import { useEditorStore } from '@/stores/editor'
import { useProjectStore } from '@/stores/project'
import { createDefaultSettingAssets, useSettingAssetsStore } from '@/stores/settingAssets'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { SettingAsset, SettingAssetTypeFilter } from '@/types/settingAsset'

const router = useRouter()
const route = useRoute()
const assetsStore = useSettingAssetsStore()
const editorStore = useEditorStore()
const projectStore = useProjectStore()
const uiFeedback = useUiFeedbackStore()

const createModalOpen = ref(false)
const previewOpen = ref(false)
const previewAsset = ref<SettingAsset | null>(null)
const generationModeDialogOpen = ref(false)
const pendingStoryboardMode = ref<'multi-param' | 'image'>('multi-param')
const selectedAssetId = ref('')
const batchMode = ref(false)
const selectedBatchIds = ref<string[]>([])
const submitting = ref(false)
const leaveConfirmOpen = ref(false)
const deleteConfirmOpen = ref(false)
const pendingLeaveTarget = ref<RouteLocationRaw | null>(null)
const pendingDeleteIds = ref<string[]>([])
const bypassLeaveGuard = ref(false)
const lastSavedSnapshot = ref('')

const projectId = computed(() => String(route.params.projectId ?? ''))
const keyword = computed({
  get: () => assetsStore.keyword,
  set: (value: string) => assetsStore.setKeyword(value),
})
const activeType = computed({
  get: () => assetsStore.activeType,
  set: (value: SettingAssetTypeFilter) => assetsStore.setActiveType(value),
})
const counts = computed(() => assetsStore.counts)
const filteredAssets = computed(() => assetsStore.filteredAssets)
const filteredAssetIds = computed(() => filteredAssets.value.map((item) => item.id))
const allAssetIds = computed(() => assetsStore.assets.map((item) => item.id))
const currentSnapshot = computed(() => buildSettingAssetsSnapshot(assetsStore.assets))
const isDirty = computed(() => currentSnapshot.value !== lastSavedSnapshot.value)
const isFilteredFullySelected = computed(
  () => filteredAssetIds.value.length > 0 && filteredAssetIds.value.every((id) => selectedBatchIds.value.includes(id)),
)
const isAllSelected = computed(
  () => allAssetIds.value.length > 0 && allAssetIds.value.every((id) => selectedBatchIds.value.includes(id)),
)
const leaveDialogCopy = buildSettingLeaveDialogCopy()
const deleteDialogCopy = computed(() => buildSettingDeleteDialogCopy(Math.max(pendingDeleteIds.value.length, 1)))
const batchActions = computed<
  Array<{ key: string; label: string; icon: AppIconName; disabled: boolean; tone: 'secondary' | 'danger' }>
>(() => {
  const disabled = selectedBatchIds.value.length === 0
  return [
    { key: 'favorite', label: '批量收藏', icon: 'asset-star-outline', disabled, tone: 'secondary' as const },
    { key: 'export', label: '批量导出', icon: 'card-upload', disabled, tone: 'secondary' as const },
    { key: 'delete', label: '批量删除', icon: 'action-delete', disabled, tone: 'danger' as const },
  ]
})

watch(
  projectId,
  async (nextProjectId) => {
    if (!nextProjectId) {
      assetsStore.resetAssets()
      lastSavedSnapshot.value = buildSettingAssetsSnapshot(assetsStore.assets)
      return
    }

    await editorStore.loadDraft(nextProjectId)
    assetsStore.setAssets(resolveSettingAssets(editorStore.draft, createDefaultSettingAssets()))
    lastSavedSnapshot.value = buildSettingAssetsSnapshot(assetsStore.assets)
  },
  { immediate: true },
)

watch(
  [filteredAssets, () => assetsStore.assets],
  ([assets, allAssets]) => {
    if (!assets.some((item) => item.id === selectedAssetId.value)) {
      selectedAssetId.value = assets[0]?.id ?? ''
    }

    selectedBatchIds.value = selectedBatchIds.value.filter((id) => allAssets.some((item) => item.id === id))
    pendingDeleteIds.value = pendingDeleteIds.value.filter((id) => allAssets.some((item) => item.id === id))
  },
  { immediate: true },
)

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const markSaved = (): void => {
  lastSavedSnapshot.value = currentSnapshot.value
}

const persistSettingDraft = async (): Promise<boolean> => {
  if (!editorStore.draft) {
    return false
  }

  submitting.value = true
  try {
    editorStore.updateSettingAssets(assetsStore.assets)
    await editorStore.saveDraft()
    markSaved()
    return true
  } catch {
    showToast('设定保存失败，请稍后再试', 'error')
    return false
  } finally {
    submitting.value = false
  }
}

const openCreateModal = (): void => {
  createModalOpen.value = true
}

const createAsset = (payload: { type: Exclude<SettingAssetTypeFilter, 'all'>; title: string; prompt: string }): void => {
  assetsStore.createAsset(payload)
  createModalOpen.value = false
}

const openPreview = (asset: SettingAsset): void => {
  previewAsset.value = asset
  previewOpen.value = true
}

const openGenerationModeDialog = (): void => {
  pendingStoryboardMode.value = editorStore.draft?.storyboardGenerationMode ?? 'multi-param'
  generationModeDialogOpen.value = true
}

const closeGenerationModeDialog = (): void => {
  if (submitting.value) {
    return
  }

  generationModeDialogOpen.value = false
}

const handleGenerate = async (id: string): Promise<void> => {
  try {
    await assetsStore.generateAssetImage(id)
    showToast('素材已生成', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'SETTING_IMAGE_GENERATE_FAILED') {
      showToast('素材生成失败，请调整提示词后重试', 'error')
      return
    }
    showToast('素材生成失败，请稍后再试', 'error')
  }
}

const handleUpload = (payload: { id: string; imageUrl: string }): void => {
  assetsStore.uploadAssetImage(payload.id, payload.imageUrl)
  showToast('素材图片已上传', 'success')
}

const handleSelectCandidate = (payload: { id: string; imageUrl: string }): void => {
  assetsStore.selectCandidateImage(payload.id, payload.imageUrl)
  showToast('候选图已应用到当前素材', 'success')
}

const handleUpdateAsset = (payload: { id: string; patch: Partial<SettingAsset> }): void => {
  assetsStore.updateAsset(payload.id, payload.patch)
}

const handleSelectAsset = (id: string): void => {
  selectedAssetId.value = id
}

const toggleBatchSelection = (id: string): void => {
  selectedBatchIds.value = selectedBatchIds.value.includes(id)
    ? selectedBatchIds.value.filter((item) => item !== id)
    : [...selectedBatchIds.value, id]
}

const toggleFavorite = (id: string): void => {
  assetsStore.toggleFavorite(id)
}

const requestDelete = (ids: string[]): void => {
  if (ids.length === 0) {
    return
  }

  pendingDeleteIds.value = [...ids]
  deleteConfirmOpen.value = true
}

const deleteAsset = (id: string): void => {
  requestDelete([id])
}

const confirmDelete = (): void => {
  const ids = [...pendingDeleteIds.value]
  if (ids.length === 0) {
    deleteConfirmOpen.value = false
    return
  }

  for (const id of ids) {
    assetsStore.deleteAsset(id)
  }

  if (ids.length > 1) {
    exitBatchMode()
  }

  showToast(buildSettingDeleteToastMessage(ids.length), 'success')
  pendingDeleteIds.value = []
  deleteConfirmOpen.value = false
}

const cancelDeleteConfirm = (): void => {
  pendingDeleteIds.value = []
  deleteConfirmOpen.value = false
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedBatchIds.value = []
}

const toggleSelectFiltered = (): void => {
  if (isFilteredFullySelected.value) {
    selectedBatchIds.value = selectedBatchIds.value.filter((id) => !filteredAssetIds.value.includes(id))
    return
  }

  selectedBatchIds.value = Array.from(new Set([...selectedBatchIds.value, ...filteredAssetIds.value]))
}

const toggleSelectAll = (): void => {
  selectedBatchIds.value = isAllSelected.value ? [] : [...allAssetIds.value]
}

const handleBatchDelete = (): void => {
  requestDelete(selectedBatchIds.value)
}

const handleBatchFavorite = (): void => {
  if (selectedBatchIds.value.length === 0) {
    return
  }

  assetsStore.setFavoriteForAssets(selectedBatchIds.value, true)
  showToast(`已收藏 ${selectedBatchIds.value.length} 项素材`, 'success')
}

const handleBatchExport = (): void => {
  if (selectedBatchIds.value.length === 0) {
    return
  }

  const selectedAssets = assetsStore.assets.filter((asset) => selectedBatchIds.value.includes(asset.id))
  const payload = {
    type: 'setting-batch-export-placeholder',
    projectId: projectId.value || 'setting',
    exportedAt: new Date().toISOString(),
    count: selectedAssets.length,
    items: selectedAssets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      title: asset.title,
      prompt: asset.prompt,
      favorite: Boolean(asset.favorite),
      imageCount: asset.imageUrls.length,
      candidateCount: asset.candidateImages?.length ?? 0,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = `${projectId.value || 'setting'}-batch-export-placeholder.json`
  link.click()
  URL.revokeObjectURL(objectUrl)

  showToast(`已导出 ${selectedAssets.length} 项素材`, 'success')
}

const handleBatchAction = (actionKey?: string): void => {
  switch (actionKey) {
    case 'favorite':
      handleBatchFavorite()
      return
    case 'export':
      handleBatchExport()
      return
    case 'delete':
    default:
      handleBatchDelete()
  }
}

const handleBatch = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }

  batchMode.value = true
}

const handleSaveExport = async (): Promise<void> => {
  const hadChanges = isDirty.value
  const saved = await persistSettingDraft()
  if (!saved) {
    return
  }

  const payload = buildProjectArtifactEnvelope({
    artifact: 'setting',
    projectId: projectId.value || 'setting',
    payload: buildSettingExportPayload(assetsStore.assets),
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = buildProjectArtifactFileName(projectId.value || 'setting', 'setting')
  link.click()
  URL.revokeObjectURL(objectUrl)

  showToast(hadChanges ? '设定已保存并导出' : '设定已导出', 'success')
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
  if (!shouldInterceptSettingLeave(isDirty.value, bypassLeaveGuard.value)) {
    if (bypassLeaveGuard.value) {
      bypassLeaveGuard.value = false
    }
    return true
  }

  pendingLeaveTarget.value = to.fullPath
  leaveConfirmOpen.value = true
  return false
})

const confirmGenerationMode = async (): Promise<void> => {
  const validation = validateEditorAdvance('settingsToStoryboard', { assets: assetsStore.assets })
  if (!validation.ok) {
    showToast(validation.message, 'error')
    return
  }

  editorStore.updateStoryboardGenerationMode(pendingStoryboardMode.value)
  const saved = await persistSettingDraft()
  if (!saved) {
    return
  }

  generationModeDialogOpen.value = false

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
