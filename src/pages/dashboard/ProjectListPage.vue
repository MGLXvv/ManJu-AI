<template>
  <section class="dashboard-page">
    <DashboardBackground />

    <div class="dashboard-page__content">
      <header class="dashboard-page__title-block">
        <h1 class="dashboard-page__title">我的项目</h1>
        <p class="dashboard-page__summary">
          共 {{ total }} 个项目
          <span class="dashboard-page__legend is-completed">已完成</span>
          <span class="dashboard-page__legend is-unfinished">未完成</span>
        </p>
      </header>

      <ProjectToolbar
        v-model:status="store.statusFilter"
        v-model:keyword="store.keyword"
        :total="total"
        :in-progress="inProgress"
        :completed="completed"
        @batch="onBatchAction"
      />

      <ProjectGrid :projects="store.filteredProjects" @create="onCreateProject" @import="onImportProject" />
    </div>

    <CreateProjectModal v-model:open="createModalOpen" @submit="handleCreateProject" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CreateProjectModal from '@/components/dashboard/CreateProjectModal.vue'
import DashboardBackground from '@/components/dashboard/DashboardBackground.vue'
import ProjectGrid from '@/components/dashboard/ProjectGrid.vue'
import ProjectToolbar from '@/components/dashboard/ProjectToolbar.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const createModalOpen = ref(false)
const total = computed(() => store.projects.length)
const inProgress = computed(() => store.projects.filter((project) => project.status === 'in_progress').length)
const completed = computed(() => store.projects.filter((project) => project.status === 'completed').length)

onMounted(() => {
  void store.bootstrap()
})

const onCreateProject = (): void => {
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

const onImportProject = (): void => {}
const onBatchAction = (): void => {}
</script>
