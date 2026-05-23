<template>
  <section class="project-list-page">
    <header class="project-list-page__toolbar">
      <div class="segmented">
        <button :class="{ active: store.statusFilter === 'all' }" @click="store.statusFilter = 'all'">全部</button>
        <button :class="{ active: store.statusFilter === 'in_progress' }" @click="store.statusFilter = 'in_progress'">进行中</button>
        <button :class="{ active: store.statusFilter === 'completed' }" @click="store.statusFilter = 'completed'">已完成</button>
      </div>
      <input v-model="store.keyword" class="search-input" placeholder="请输入项目名称" />
    </header>

    <div class="project-grid">
      <article class="project-card project-card--create">
        <AppButton>新建项目</AppButton>
        <AppButton>导入</AppButton>
      </article>
      <RouterLink v-for="project in store.filteredProjects" :key="project.id" class="project-card" :to="`/projects/${project.id}/editor/${project.currentStep}`">
        <strong>{{ project.name }}</strong>
        <span>{{ project.updatedAt }}</span>
        <small>{{ project.status === 'completed' ? '已完成' : '进行中' }}</small>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppButton from '@/components/app/AppButton.vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
</script>
