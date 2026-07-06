<template>
  <header class="setting-toolbar">
    <div class="setting-toolbar__model">
      <EditorModelSelect
        :model-value="modelValue"
        :options="modelOptions"
        @update:model-value="(value) => $emit('update:modelValue', value)"
      />
    </div>

    <label class="setting-toolbar__search">
      <input v-model="keywordProxy" type="text" placeholder="搜索名称" />
      <FigmaIcon name="search" :size="16" />
    </label>

    <button class="setting-toolbar__btn" type="button" @click="$emit('add')">
      <FigmaIcon name="card-add" :size="14" />
      <span>添加</span>
    </button>
    <button class="setting-toolbar__btn" type="button" @click="openResourceLibraryImportDialog">
      <FigmaIcon name="card-upload" :size="14" />
      <span>资源库导入</span>
    </button>
    <button class="setting-toolbar__btn" type="button" @click="$emit('batch')">
      <FigmaIcon name="batch" :size="16" />
      <span>{{ batchLabel }}</span>
    </button>

    <div class="setting-toolbar__spacer"></div>

    <button class="setting-toolbar__outline" type="button" @click="$emit('save-export')">保存并导出</button>
    <button class="setting-toolbar__primary" type="button" @click="$emit('next')">进入分镜生成</button>
  </header>

  <ResourceLibraryImportDialog
    :open="resourceLibraryDialogOpen"
    :loading="resourceLibraryLoading"
    :items="resourceLibraryItems"
    :active-type="resourceLibraryType"
    :importing-id="resourceLibraryImportingId"
    @close="closeResourceLibraryImportDialog"
    @update:type="handleResourceLibraryTypeChange"
    @import="handleImportFromLibrary"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import EditorModelSelect from '@/components/editor/common/EditorModelSelect.vue'
import type { EditorModelOption } from '@/components/editor/common/EditorModelSelect.vue'
import ResourceLibraryImportDialog from '@/components/editor/setting/ResourceLibraryImportDialog.vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { apiMode } from '@/api/shared/apiMode'
import { resourceLibraryService } from '@/services/editor/resourceLibrary.service'
import { useEditorStore } from '@/stores/editor'
import { useSettingAssetsStore } from '@/stores/settingAssets'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import type { ResourceLibraryQueryType } from '@/api/modules/editor/resourceLibrary.mapper'
import type { SettingAsset } from '@/types/settingAsset'

const props = withDefaults(
  defineProps<{
    keyword: string
    modelValue?: string
    modelOptions?: EditorModelOption[]
    batchLabel?: string
  }>(),
  {
    batchLabel: '批量操作',
  },
)

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'update:modelValue', value: string): void
  (e: 'add'): void
  (e: 'import-library'): void
  (e: 'batch'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()

const route = useRoute()
const assetsStore = useSettingAssetsStore()
const editorStore = useEditorStore()
const uiFeedback = useUiFeedbackStore()
const resourceLibraryDialogOpen = ref(false)
const resourceLibraryLoading = ref(false)
const resourceLibraryItems = ref<SettingAsset[]>([])
const resourceLibraryType = ref<ResourceLibraryQueryType>('all')
const resourceLibraryImportingId = ref('')

const keywordProxy = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
})

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  uiFeedback.showToast(message, { tone })
}

const loadResourceLibraryItems = async (): Promise<void> => {
  resourceLibraryLoading.value = true
  try {
    const result = await resourceLibraryService.listLibraryItems({
      type: resourceLibraryType.value,
      page: 1,
      pageSize: 20,
      scope: 'PRIVATE',
    })
    resourceLibraryItems.value = result.items
  } finally {
    resourceLibraryLoading.value = false
  }
}

const openResourceLibraryImportDialog = async (): Promise<void> => {
  resourceLibraryDialogOpen.value = true
  await loadResourceLibraryItems()
}

const closeResourceLibraryImportDialog = (): void => {
  resourceLibraryDialogOpen.value = false
  resourceLibraryImportingId.value = ''
}

const handleResourceLibraryTypeChange = async (value: ResourceLibraryQueryType): Promise<void> => {
  resourceLibraryType.value = value
  await loadResourceLibraryItems()
}

const handleImportFromLibrary = async (resourceAssetId: string): Promise<void> => {
  const projectId = String(route.params.projectId ?? '')
  if (!projectId) {
    showToast('未找到当前项目，无法导入资源', 'error')
    return
  }

  try {
    resourceLibraryImportingId.value = resourceAssetId
    const syncedAssets = await resourceLibraryService.importFromLibrary(projectId, [resourceAssetId])
    if (syncedAssets?.length) {
      const nextAssets = apiMode === 'http' ? syncedAssets : [...syncedAssets, ...assetsStore.assets]
      assetsStore.setAssets(nextAssets)
      editorStore.updateSettingAssets(nextAssets)
    }
    showToast('已从资源库导入', 'success')
    closeResourceLibraryImportDialog()
  } catch {
    showToast('从资源库导入失败，请稍后再试', 'error')
  } finally {
    resourceLibraryImportingId.value = ''
  }
}
</script>