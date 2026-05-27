<template>
  <RouterLink class="project-card" :to="`/projects/${project.id}/editor/${project.currentStep}`">
    <img v-if="project.coverUrl" class="project-card__image" :src="project.coverUrl" :alt="project.name" />
    <div v-else class="project-card__fallback"></div>

    <div class="project-card__shade"></div>

    <span class="project-card__mark" :class="project.status === 'completed' ? 'is-completed' : 'is-unfinished'">
      ●
    </span>

    <div class="project-card__info">
      <strong class="project-card__title">{{ project.name }}</strong>
      <span v-if="project.duration" class="project-card__duration">{{ project.duration }}</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import type { Project } from '@/types/project'

defineProps<{
  project: Project
}>()
</script>
