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
        @next="goImageGenerate"
      />

      <SettingTabs v-model="activeType" :counts="counts" />

      <BatchSelectionToolbar
        v-if="batchMode"
        action-label="批量删除"
        primary-label="本页全选"
        secondary-label="全部资产"
        :selected-count="selectedBatchIds.length"
        :total-count="assetsStore.assets.length"
        :primary-selected="isFilteredFullySelected"
        :secondary-selected="isAllSelected"
        :action-disabled="selectedBatchIds.length === 0"
        @exit="exitBatchMode"
        @toggle-primary="toggleSelectFiltered"
        @toggle-secondary="toggleSelectAll"
        @action="handleBatchDelete"
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
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import AssetGrid from '@/components/editor/setting/AssetGrid.vue'
import AssetPreviewModal from '@/components/editor/setting/AssetPreviewModal.vue'
import CreateAssetModal from '@/components/editor/setting/CreateAssetModal.vue'
import SettingTabs from '@/components/editor/setting/SettingTabs.vue'
import SettingToolbar from '@/components/editor/setting/SettingToolbar.vue'
import { useSettingAssetsStore } from '@/stores/settingAssets'
import type { SettingAsset, SettingAssetTypeFilter } from '@/types/settingAsset'

const router = useRouter()
const route = useRoute()
const assetsStore = useSettingAssetsStore()

const createModalOpen = ref(false)
const previewOpen = ref(false)
const previewAsset = ref<SettingAsset | null>(null)
const selectedAssetId = ref('')
const batchMode = ref(false)
const selectedBatchIds = ref<string[]>([])

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
const isFilteredFullySelected = computed(
  () =>
    filteredAssetIds.value.length > 0 &&
    filteredAssetIds.value.every((id) => selectedBatchIds.value.includes(id)),
)
const isAllSelected = computed(
  () => allAssetIds.value.length > 0 && allAssetIds.value.every((id) => selectedBatchIds.value.includes(id)),
)

watch(
  [filteredAssets, () => assetsStore.assets],
  ([assets, allAssets]) => {
    if (!assets.some((item) => item.id === selectedAssetId.value)) {
      selectedAssetId.value = assets[0]?.id ?? ''
    }

    selectedBatchIds.value = selectedBatchIds.value.filter((id) => allAssets.some((item) => item.id === id))
  },
  { immediate: true },
)

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

const handleGenerate = (id: string): void => {
  void assetsStore.generateAssetImage(id)
}

const handleUpload = (payload: { id: string; imageUrl: string }): void => {
  assetsStore.uploadAssetImage(payload.id, payload.imageUrl)
}

const handleSelectCandidate = (payload: { id: string; imageUrl: string }): void => {
  assetsStore.selectCandidateImage(payload.id, payload.imageUrl)
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

const deleteAsset = (id: string): void => {
  assetsStore.deleteAsset(id)
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
  if (selectedBatchIds.value.length === 0) return

  for (const id of [...selectedBatchIds.value]) {
    assetsStore.deleteAsset(id)
  }

  exitBatchMode()
}

const handleBatch = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }

  batchMode.value = true
}

const handleSaveExport = (): void => {}

const goImageGenerate = (): void => {
  router.push({
    name: 'editor-storyboard',
    params: route.params,
  })
}
</script>
