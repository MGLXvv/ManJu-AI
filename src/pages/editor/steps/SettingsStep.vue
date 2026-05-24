<template>
  <section class="setting-step">
    <div class="setting-step__bg" aria-hidden="true"></div>

    <div class="setting-workbench">
      <SettingToolbar
        v-model:keyword="keyword"
        @add="openCreateModal"
        @batch="handleBatch"
        @save-export="handleSaveExport"
        @next="goImageGenerate"
      />

      <SettingTabs v-model="activeType" :counts="counts" />

      <AssetGrid
        :assets="filteredAssets"
        :selected-asset-id="selectedAssetId"
        @generate="handleGenerate"
        @upload="handleUpload"
        @update="handleUpdateAsset"
        @select="handleSelectAsset"
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

watch(
  filteredAssets,
  (assets) => {
    if (!assets.some((item) => item.id === selectedAssetId.value)) {
      selectedAssetId.value = assets[0]?.id ?? ''
    }
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

const handleUpdateAsset = (payload: { id: string; patch: Partial<SettingAsset> }): void => {
  assetsStore.updateAsset(payload.id, payload.patch)
}

const handleSelectAsset = (id: string): void => {
  selectedAssetId.value = id
}

const toggleFavorite = (id: string): void => {
  assetsStore.toggleFavorite(id)
}

const deleteAsset = (id: string): void => {
  assetsStore.deleteAsset(id)
}

const handleBatch = (): void => {}
const handleSaveExport = (): void => {}

const goImageGenerate = (): void => {
  router.push({
    name: 'editor-storyboard',
    params: route.params,
  })
}
</script>
