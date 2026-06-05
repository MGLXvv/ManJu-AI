<template>
  <section class="project-grid-block">
    <div class="project-grid">
      <ProjectCreateCard v-if="!batchMode" @create="$emit('create')" @import="$emit('import')" />
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :batch-mode="batchMode"
        :selected="selectedIds.includes(project.id)"
        @toggle-select="$emit('toggle-select', $event)"
        @delete="$emit('delete', $event)"
        @export="$emit('export', $event)"
      />

      <div v-if="!projects.length" class="project-empty-state">
        <p class="project-empty-state__title">没有匹配的项目</p>
        <p class="project-empty-state__desc">试试调整筛选条件或新建一个项目。</p>
      </div>
    </div>

    <ProjectPagination :model-value="currentPage" :pages="pages" @update:model-value="$emit('update:currentPage', $event)" />
  </section>
</template>

<script setup lang="ts">
import ProjectCard from '@/components/dashboard/ProjectCard.vue'
import ProjectCreateCard from '@/components/dashboard/ProjectCreateCard.vue'
import ProjectPagination from '@/components/dashboard/ProjectPagination.vue'
import type { Project } from '@/types/project'

withDefaults(
  defineProps<{
    projects: Project[]
    batchMode?: boolean
    selectedIds?: string[]
    currentPage: number
    pages: number[]
  }>(),
  {
    batchMode: false,
    selectedIds: () => [],
    pages: () => [1],
  },
)

defineEmits<{
  (e: 'create'): void
  (e: 'import'): void
  (e: 'toggle-select', id: string): void
  (e: 'delete', id: string): void
  (e: 'export', id: string): void
  (e: 'update:currentPage', page: number): void
}>()
</script>
