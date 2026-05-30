<template>
  <section class="project-grid-block" aria-label="项目列表">
    <div class="project-grid">
      <ProjectCreateCard @create="$emit('create')" @import="$emit('import')" />

      <ProjectCard v-for="project in pagedProjects" :key="project.id" :project="project" />

      <article v-if="projects.length === 0" class="project-empty-state">
        <h3 class="project-empty-state__title">还没有项目</h3>
        <p class="project-empty-state__desc">点击左侧卡片新建项目，或导入已有项目继续创作。</p>
      </article>
    </div>

    <ProjectPagination
      v-if="projects.length > 0"
      v-model="page"
      :pages="pages"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProjectCard from './ProjectCard.vue'
import ProjectCreateCard from './ProjectCreateCard.vue'
import ProjectPagination from './ProjectPagination.vue'
import type { Project } from '@/types/project'

const props = defineProps<{
  projects: Project[]
}>()

defineEmits<{
  (e: 'create'): void
  (e: 'import'): void
}>()

const page = ref(1)
const pageSize = ref(29)

const totalPages = computed(() => Math.max(1, Math.ceil(props.projects.length / pageSize.value)))
const pages = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return props.projects.slice(start, start + pageSize.value)
})

watch(
  () => props.projects.length,
  () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  },
)

watch(pageSize, () => {
  page.value = 1
})
</script>
