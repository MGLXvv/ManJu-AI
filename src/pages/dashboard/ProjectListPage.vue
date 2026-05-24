<template>
  <section class="dashboard-page">
    <DashboardBackground />

    <div class="dashboard-page__content">
      <header class="dashboard-page__title-block">
        <h1 class="dashboard-page__title">我的项目</h1>
        <p class="dashboard-page__summary">共 {{ store.projects.length }} 个项目</p>
      </header>

      <ProjectToolbar v-model:status="store.statusFilter" v-model:keyword="store.keyword" />

      <ProjectGrid :projects="store.filteredProjects" @create="onCreateProject" @import="onImportProject" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardBackground from '@/components/dashboard/DashboardBackground.vue'
import ProjectGrid from '@/components/dashboard/ProjectGrid.vue'
import ProjectToolbar from '@/components/dashboard/ProjectToolbar.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()

onMounted(() => {
  void store.bootstrap()
})

const onCreateProject = async (): Promise<void> => {
  const name = `新项目 ${store.projects.length + 1}`
  await store.createProject(name)
}

const onImportProject = (): void => {}
</script>
