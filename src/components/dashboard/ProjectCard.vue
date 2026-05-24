<template>
  <RouterLink class="project-card" :to="`/projects/${project.id}/editor/${project.currentStep}`">
    <div class="project-card__cover">
      <span class="project-card__badge" :class="`is-${project.status}`">
        {{ project.status === 'completed' ? '已完成' : '进行中' }}
      </span>
      <span class="project-card__title-shadow">{{ project.name }}</span>
    </div>
    <div class="project-card__body">
      <strong class="project-card__title">{{ project.name }}</strong>
      <span class="project-card__meta">{{ project.updatedAt }}</span>
      <span class="project-card__meta">画幅 {{ project.ratio }} · {{ project.style }}</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import type { Project } from '@/types/project'

defineProps<{
  project: Project
}>()
</script>
