<template>
  <section class="resource-page">
    <div class="resource-page__bg" aria-hidden="true"></div>

    <div class="resource-page__content">
      <ResourceLibraryToolbar
        v-model:keyword="keyword"
        v-model:source-filter="sourceFilter"
        v-model:type-filter="typeFilter"
        :batch-label="batchMode ? '退出批量' : '批量操作'"
        :search-placeholder="activeTab === 'creative' ? '请输入提示词、主体、故事板' : '请输入关键词'"
        @batch="toggleBatchMode"
      />

      <ResourceLibraryTabs v-model="activeTab" />

      <div class="resource-page__panel">
        <ResourceFolderSidebar
          :folders="visibleFolders"
          :active-folder-id="activeFolderId"
          :counts="folderCounts"
          @add-folder="noop"
          @select-folder="handleSelectFolder"
        />

        <div class="resource-page__main">
          <BatchSelectionToolbar
            v-if="batchMode"
            action-label="批量删除"
            primary-label="本页全选"
            :selected-count="selectedIds.length"
            :total-count="filteredAssets.length"
            :primary-selected="isPageFullySelected"
            :action-disabled="selectedIds.length === 0"
            @exit="exitBatchMode"
            @toggle-primary="toggleSelectCurrentPage"
            @action="deleteSelected"
          />

          <ResourceAssetGrid
            :assets="pagedAssets"
            :tab="activeTab"
            :default-source="activeFolderSource"
            :batch-mode="batchMode"
            :selected-ids="selectedIds"
            :creating="creating"
            :editing-id="editingId"
            @create="beginCreate"
            @cancel-create="cancelCreate"
            @save-create="saveCreate"
            @edit="beginEdit"
            @cancel-edit="cancelEdit"
            @save-edit="saveEdit"
            @delete="deleteAsset"
            @toggle-select="toggleSelect"
          />
        </div>
      </div>

      <footer class="project-pagination">
        <span class="resource-page__pagination-total">共 {{ totalPages }} 页</span>
        <button
          type="button"
          class="project-pagination__arrow is-plain"
          :disabled="currentPage === 1"
          @click="currentPage -= 1"
        >
          ‹
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          class="project-pagination__item"
          :class="{ 'is-active': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="project-pagination__arrow is-plain"
          :disabled="currentPage === totalPages"
          @click="currentPage += 1"
        >
          ›
        </button>

        <div class="project-pagination__jump-wrap">
          <select v-model.number="currentPage" class="project-pagination__select">
            <option v-for="page in totalPages" :key="page" :value="page">{{ page }}/页</option>
          </select>
          <FigmaIcon class="project-pagination__select-icon" name="chevron-down" :size="14" />
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import { resolveHttpReadonlyState } from '@/features/backend/httpReadonlyState'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import ResourceAssetGrid from '@/components/resource/ResourceAssetGrid.vue'
import ResourceFolderSidebar from '@/components/resource/ResourceFolderSidebar.vue'
import ResourceLibraryTabs from '@/components/resource/ResourceLibraryTabs.vue'
import ResourceLibraryToolbar from '@/components/resource/ResourceLibraryToolbar.vue'
import { useResourcesStore } from '@/stores/resources'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { ResourceAssetSource } from '@/types/resource'

const store = useResourcesStore()
const uiFeedback = useUiFeedbackStore()
const PAGE_SIZE = 6
const readonlyState = resolveHttpReadonlyState('resource')

const batchMode = ref(false)
const selectedIds = ref<string[]>([])
const creating = ref(false)
const editingId = ref('')
const currentPage = ref(1)

const activeTab = computed({
  get: () => store.activeTab,
  set: (value) => store.setActiveTab(value),
})

const activeFolderId = computed(() => store.activeFolderId)
const keyword = computed({
  get: () => store.keyword,
  set: (value: string) => {
    store.keyword = value
  },
})
const sourceFilter = computed({
  get: () => store.sourceFilter,
  set: (value) => {
    store.sourceFilter = value
  },
})
const typeFilter = computed({
  get: () => store.typeFilter,
  set: (value) => {
    store.typeFilter = value
  },
})

const visibleFolders = computed(() => store.visibleFolders)
const folderCounts = computed(() => store.folderCounts)
const filteredAssets = computed(() => store.filteredAssets)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredAssets.value.length / PAGE_SIZE)))
const pagedAssets = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredAssets.value.slice(start, start + PAGE_SIZE)
})
const currentPageIds = computed(() => pagedAssets.value.map((asset) => asset.id))
const isPageFullySelected = computed(
  () => currentPageIds.value.length > 0 && currentPageIds.value.every((id) => selectedIds.value.includes(id)),
)
const visiblePages = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1).slice(0, 5))
const activeFolderSource = computed<ResourceAssetSource>(() => {
  return visibleFolders.value.find((folder) => folder.id === activeFolderId.value)?.source ?? 'created'
})

watch([filteredAssets, activeTab], ([assets]) => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  selectedIds.value = selectedIds.value.filter((id) => assets.some((asset) => asset.id === id))
  creating.value = false
  editingId.value = ''
})

onMounted(() => {
  void store.hydrate()
})

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const blockReadonlyWrite = (): boolean => {
  if (!readonlyState.readonly) {
    return false
  }

  showToast(readonlyState.message, 'error')
  return true
}

const handleSelectFolder = (id: string): void => {
  store.setActiveFolder(id)
}

const beginCreate = (): void => {
  if (blockReadonlyWrite()) {
    return
  }
  creating.value = true
  editingId.value = ''
}

const cancelCreate = (): void => {
  creating.value = false
}

const saveCreate = async (payload: {
  type: 'character' | 'scene'
  name: string
  prompt: string
  imageUrl: string
  selectedVoiceId?: string
}): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.createAsset({
    tab: activeTab.value,
    source: activeFolderSource.value,
    ...payload,
  })
  creating.value = false
  currentPage.value = 1
}

const beginEdit = (id: string): void => {
  if (blockReadonlyWrite()) {
    return
  }
  editingId.value = id
  creating.value = false
}

const cancelEdit = (): void => {
  editingId.value = ''
}

const saveEdit = async (payload: {
  id: string
  payload: {
    type: 'character' | 'scene'
    name: string
    prompt: string
    imageUrl: string
    selectedVoiceId?: string
  }
}): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.updateAsset(payload.id, payload.payload)
  editingId.value = ''
}

const deleteAsset = async (id: string): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  await store.deleteAsset(id)
  selectedIds.value = selectedIds.value.filter((item) => item !== id)
  if (editingId.value === id) {
    editingId.value = ''
  }
}

const toggleBatchMode = (): void => {
  if (batchMode.value) {
    exitBatchMode()
    return
  }
  if (blockReadonlyWrite()) {
    return
  }
  creating.value = false
  editingId.value = ''
  batchMode.value = true
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedIds.value = []
}

const toggleSelect = (id: string): void => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((item) => item !== id)
    : [...selectedIds.value, id]
}

const toggleSelectCurrentPage = (): void => {
  if (isPageFullySelected.value) {
    selectedIds.value = selectedIds.value.filter((id) => !currentPageIds.value.includes(id))
    return
  }
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentPageIds.value]))
}

const deleteSelected = async (): Promise<void> => {
  if (blockReadonlyWrite()) {
    return
  }
  for (const id of [...selectedIds.value]) {
    await store.deleteAsset(id)
  }
  exitBatchMode()
}

const noop = (): void => {}
</script>
