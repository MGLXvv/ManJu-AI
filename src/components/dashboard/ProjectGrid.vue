<template>
  <section class="project-grid" aria-label="项目列表">
    <ProjectCreateCard @create="$emit('create')" @import="$emit('import')" />

    <ProjectCard v-for="project in projects" :key="project.id" :project="project" />

    <article v-if="projects.length === 0" class="project-empty-state">
      <h3 class="project-empty-state__title">还没有项目</h3>
      <p class="project-empty-state__desc">点击左侧卡片新建项目，或导入已有项目继续创作。</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import ProjectCard from './ProjectCard.vue'
import ProjectCreateCard from './ProjectCreateCard.vue'
import type { Project } from '@/types/project'

defineProps<{
  projects: Project[]
}>()

defineEmits<{
  (e: 'create'): void
  (e: 'import'): void
}>()
</script>
