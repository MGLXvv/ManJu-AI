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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import DashboardBackground from '@/components/dashboard/DashboardBackground.vue'
import ProjectGrid from '@/components/dashboard/ProjectGrid.vue'
import ProjectToolbar from '@/components/dashboard/ProjectToolbar.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const total = computed(() => store.projects.length)
const inProgress = computed(() => store.projects.filter((project) => project.status === 'in_progress').length)
const completed = computed(() => store.projects.filter((project) => project.status === 'completed').length)

onMounted(() => {
  void store.bootstrap()
})

const onCreateProject = async (): Promise<void> => {
  const name = `新项目 ${store.projects.length + 1}`
  await store.createProject(name)
}

const onImportProject = (): void => {}
const onBatchAction = (): void => {}
</script>
