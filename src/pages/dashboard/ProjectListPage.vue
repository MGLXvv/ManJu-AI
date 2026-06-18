<template>
  <section class="dashboard-page">
    <div class="dashboard-page__content">
      <div class="dashboard-page__header-shell">
        <header class="dashboard-page__title-block">
          <h1 class="dashboard-page__title">我的项目</h1>
          <p class="dashboard-page__summary">
            共 {{ total }} 个项目
            <span class="dashboard-page__legend is-completed">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M6.35897 6.50096L5.25262 8.82606C5.18142 8.97566 5.00242 9.03921 4.85282 8.96801C4.81947 8.95216 4.78932 8.93026 4.76392 8.90346L2.99321 7.03406C2.94581 6.98401 2.88263 6.95181 2.81429 6.94291L0.261149 6.60916C0.0968595 6.58771 -0.0189106 6.43711 0.00256436 6.27281C0.00734936 6.23621 0.0188645 6.20076 0.0365195 6.16831L1.26722 3.90661C1.30017 3.84606 1.31126 3.77601 1.29864 3.70827L0.827069 1.17696C0.796724 1.01408 0.904169 0.85744 1.06705 0.827095C1.10337 0.82033 1.14062 0.82033 1.17694 0.827095L3.70825 1.29866C3.77602 1.31128 3.84607 1.30019 3.90657 1.26725L6.16827 0.0365448C6.31382 -0.0426502 6.49602 0.0111347 6.57517 0.156665C6.59287 0.189115 6.60437 0.224545 6.60912 0.261175L6.94287 2.81432C6.95182 2.88266 6.98402 2.94584 7.03402 2.99323L8.90342 4.76391C9.02372 4.87786 9.02887 5.06776 8.91492 5.18806C8.88952 5.21486 8.85937 5.23676 8.82602 5.25261L6.50097 6.35901C6.43872 6.38861 6.38857 6.43876 6.35897 6.50096ZM6.75737 7.46451L7.46447 6.75741L9.58582 8.87871L8.87872 9.58581L6.75737 7.46451Z" fill="currentColor" />
              </svg>
              已完成
            </span>
            <span class="dashboard-page__legend is-unfinished">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M6.35897 6.50096L5.25262 8.82606C5.18142 8.97566 5.00242 9.03921 4.85282 8.96801C4.81947 8.95216 4.78932 8.93026 4.76392 8.90346L2.99321 7.03406C2.94581 6.98401 2.88263 6.95181 2.81429 6.94291L0.261149 6.60916C0.0968595 6.58771 -0.0189106 6.43711 0.00256436 6.27281C0.00734936 6.23621 0.0188645 6.20076 0.0365195 6.16831L1.26722 3.90661C1.30017 3.84606 1.31126 3.77601 1.29864 3.70827L0.827069 1.17696C0.796724 1.01408 0.904169 0.85744 1.06705 0.827095C1.10337 0.82033 1.14062 0.82033 1.17694 0.827095L3.70825 1.29866C3.77602 1.31128 3.84607 1.30019 3.90657 1.26725L6.16827 0.0365448C6.31382 -0.0426502 6.49602 0.0111347 6.57517 0.156665C6.59287 0.189115 6.60437 0.224545 6.60912 0.261175L6.94287 2.81432C6.95182 2.88266 6.98402 2.94584 7.03402 2.99323L8.90342 4.76391C9.02372 4.87786 9.02887 5.06776 8.91492 5.18806C8.88952 5.21486 8.85937 5.23676 8.82602 5.25261L6.50097 6.35901C6.43872 6.38861 6.38857 6.43876 6.35897 6.50096ZM6.75737 7.46451L7.46447 6.75741L9.58582 8.87871L8.87872 9.58581L6.75737 7.46451Z" fill="currentColor" />
              </svg>
              进行中
            </span>
          </p>
        </header>

        <BatchSelectionToolbar
          v-if="batchMode"
          :selected-count="selectedIds.length"
          :total-count="visibleProjectIds.length"
          action-label="批量删除"
          :action-disabled="!selectedIds.length"
          primary-label="本页全选"
          :primary-selected="allVisibleSelected"
          @exit="exitBatchMode"
          @toggle-primary="toggleSelectAllVisible"
          @action="deleteSelectedProjects"
        />

        <ProjectToolbar
          v-else
          v-model:status="store.statusFilter"
          v-model:keyword="store.keyword"
          :total="total"
          :in-progress="inProgress"
          :completed="completed"
          @batch="onBatchAction"
        />
      </div>

      <div class="dashboard-page__list-shell">
        <ProjectGrid
          :projects="pagedProjects"
          :batch-mode="batchMode"
          :selected-ids="selectedIds"
          :current-page="currentPage"
          :pages="pageNumbers"
          @create="onCreateProject"
          @import="onImportProject"
          @toggle-select="toggleProjectSelection"
          @delete="deleteSingleProject"
          @export="exportSingleProject"
          @update:current-page="currentPage = $event"
        />
      </div>
    </div>

    <input
      ref="importInput"
      class="dashboard-page__import-input"
      type="file"
      accept="application/json,.json"
      @change="onImportFileChange"
    />

    <CreateProjectModal
      v-model:open="createModalOpen"
      :style-options="projectStyleOptions"
      @submit="handleCreateProject"
    />
    <AppConfirmDialog
      :open="Boolean(deleteConfirm)"
      :title="deleteConfirm?.title ?? ''"
      :confirm-text="deleteConfirm?.confirmText ?? ''"
      :cancel-text="deleteConfirm?.cancelText ?? ''"
      confirm-tone="danger"
      size="sm"
      center-title
      center-actions
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import { buildDeleteDialogCopy, buildDeleteToastMessage } from '@/features/dashboard/projectDeleteState'
import { buildProjectExportFileName, parseImportedProjects } from '@/features/dashboard/projectTransferState'
import { mapSystemStylesToProjectStyleOptions } from '@/features/project/projectStyleState'
import { buildProjectArtifactEnvelope } from '@/features/shared/projectArtifactState'
import BatchSelectionToolbar from '@/components/editor/common/BatchSelectionToolbar.vue'
import CreateProjectModal from '@/components/dashboard/CreateProjectModal.vue'
import ProjectGrid from '@/components/dashboard/ProjectGrid.vue'
import ProjectToolbar from '@/components/dashboard/ProjectToolbar.vue'
import { useProjectStore } from '@/stores/project'
import { useSystemStore } from '@/stores/system'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const store = useProjectStore()
const systemStore = useSystemStore()
const uiFeedback = useUiFeedbackStore()
const createModalOpen = ref(false)
const batchMode = ref(false)
const selectedIds = ref<string[]>([])
const currentPage = ref(1)
const importInput = ref<HTMLInputElement | null>(null)
const deleteConfirm = ref<null | { ids: string[]; title: string; confirmText: string; cancelText: string }>(null)
const total = computed(() => store.projects.length)
const inProgress = computed(() => store.projects.filter((project) => project.status === 'in_progress').length)
const completed = computed(() => store.projects.filter((project) => project.status === 'completed').length)
const pageSize = computed(() => (batchMode.value ? 30 : 29))
const totalPages = computed(() => Math.max(1, Math.ceil(store.filteredProjects.length / pageSize.value)))
const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))
const projectStyleOptions = computed(() => mapSystemStylesToProjectStyleOptions(systemStore.styles))
const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return store.filteredProjects.slice(start, start + pageSize.value)
})
const visibleProjectIds = computed(() => pagedProjects.value.map((project) => project.id))
const allVisibleSelected = computed(() => visibleProjectIds.value.length > 0 && visibleProjectIds.value.every((id) => selectedIds.value.includes(id)))

watch(
  () => visibleProjectIds.value,
  (ids) => {
    selectedIds.value = selectedIds.value.filter((id) => ids.includes(id))
  },
)

watch(
  [() => store.filteredProjects.length, pageSize],
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }

    if (currentPage.value < 1) {
      currentPage.value = 1
    }
  },
  { immediate: true },
)

watch([() => store.statusFilter, () => store.keyword], () => {
  currentPage.value = 1
})

onMounted(() => {
  void store.bootstrap()
  void systemStore.hydrate()
})

const onCreateProject = (): void => {
  if (batchMode.value) return
  createModalOpen.value = true
}

interface CreateProjectPayload {
  name: string
  ratio: '16:9' | '9:16'
  style: string
}

const handleCreateProject = async (payload: CreateProjectPayload): Promise<void> => {
  await store.createProject(payload.name, {
    ratio: payload.ratio,
    style: payload.style,
  })
  createModalOpen.value = false
}

const onImportProject = (): void => {
  if (batchMode.value) return
  importInput.value?.click()
}

const exportSingleProject = async (id: string): Promise<void> => {
  const project = await store.exportProject(id)
  if (!project) {
    uiFeedback.showToast('导出失败，未找到当前项目', { tone: 'error' })
    return
  }

  const fileName = buildProjectExportFileName(project.name)
  const payload = buildProjectArtifactEnvelope({
    artifact: 'project',
    projectId: project.id || project.name,
    payload: project,
  })
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  uiFeedback.showToast('项目已导出', { tone: 'success' })
}

const onImportFileChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const imported = parseImportedProjects(text)
    const created = await store.importProjects(imported)
    currentPage.value = 1
    uiFeedback.showToast(created.length === 1 ? '项目已导入' : `已导入 ${created.length} 个项目`, { tone: 'success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'PROJECT_IMPORT_INVALID') {
      uiFeedback.showToast('导入失败，文件内容不符合项目格式', { tone: 'error' })
    } else {
      uiFeedback.showToast('导入失败，请选择有效的 JSON 文件', { tone: 'error' })
    }
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

const onBatchAction = (): void => {
  batchMode.value = true
  selectedIds.value = []
  currentPage.value = 1
}

const exitBatchMode = (): void => {
  batchMode.value = false
  selectedIds.value = []
  currentPage.value = 1
}

const toggleProjectSelection = (id: string): void => {
  if (!batchMode.value) return
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((current) => current !== id)
    : [...selectedIds.value, id]
}

const toggleSelectAllVisible = (): void => {
  selectedIds.value = allVisibleSelected.value ? [] : [...visibleProjectIds.value]
}

const deleteSelectedProjects = async (): Promise<void> => {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  deleteConfirm.value = {
    ids,
    ...buildDeleteDialogCopy(ids.length),
  }
}

const deleteSingleProject = async (id: string): Promise<void> => {
  deleteConfirm.value = {
    ids: [id],
    ...buildDeleteDialogCopy(1),
  }
}

const cancelDelete = (): void => {
  deleteConfirm.value = null
}

const confirmDelete = async (): Promise<void> => {
  if (!deleteConfirm.value) return

  const ids = [...deleteConfirm.value.ids]
  deleteConfirm.value = null
  await Promise.all(ids.map((id) => store.deleteProject(id)))

  if (batchMode.value) {
    exitBatchMode()
  }

  uiFeedback.showToast(buildDeleteToastMessage(ids.length), { tone: 'success' })
}
</script>
