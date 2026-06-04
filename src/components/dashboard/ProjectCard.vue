<template>
  <article
    class="project-card"
    :class="{ 'is-batch-mode': batchMode }"
    :role="batchMode ? 'button' : undefined"
    :tabindex="batchMode ? 0 : undefined"
    @click="handleCardClick"
    @keydown.enter.prevent="batchMode ? handleCardClick() : undefined"
    @keydown.space.prevent="batchMode ? handleCardClick() : undefined"
  >
    <button
      v-if="batchMode"
      type="button"
      class="project-card__check"
      :class="{ 'is-active': selected }"
      aria-label="选择项目"
      @click.stop="$emit('toggle-select', project.id)"
    >
      <span></span>
    </button>

    <div v-if="project.coverUrl" class="project-card__image-wrap">
      <img class="project-card__image" :src="project.coverUrl" :alt="project.name" />
    </div>
    <div v-else class="project-card__fallback"></div>

    <div class="project-card__shade"></div>

    <span
      class="project-card__mark"
      :class="project.status === 'completed' ? 'is-completed' : 'is-unfinished'"
      :aria-label="project.status === 'completed' ? '已完成' : '进行中'"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M6.35897 6.50096L5.25262 8.82606C5.18142 8.97566 5.00242 9.03921 4.85282 8.96801C4.81947 8.95216 4.78932 8.93026 4.76392 8.90346L2.99321 7.03406C2.94581 6.98401 2.88263 6.95181 2.81429 6.94291L0.261149 6.60916C0.0968595 6.58771 -0.0189106 6.43711 0.00256436 6.27281C0.00734936 6.23621 0.0188645 6.20076 0.0365195 6.16831L1.26722 3.90661C1.30017 3.84606 1.31126 3.77601 1.29864 3.70827L0.827069 1.17696C0.796724 1.01408 0.904169 0.85744 1.06705 0.827095C1.10337 0.82033 1.14062 0.82033 1.17694 0.827095L3.70825 1.29866C3.77602 1.31128 3.84607 1.30019 3.90657 1.26725L6.16827 0.0365448C6.31382 -0.0426502 6.49602 0.0111347 6.57517 0.156665C6.59287 0.189115 6.60437 0.224545 6.60912 0.261175L6.94287 2.81432C6.95182 2.88266 6.98402 2.94584 7.03402 2.99323L8.90342 4.76391C9.02372 4.87786 9.02887 5.06776 8.91492 5.18806C8.88952 5.21486 8.85937 5.23676 8.82602 5.25261L6.50097 6.35901C6.43872 6.38861 6.38857 6.43876 6.35897 6.50096ZM6.75737 7.46451L7.46447 6.75741L9.58582 8.87871L8.87872 9.58581L6.75737 7.46451Z"
          fill="currentColor"
        />
      </svg>
    </span>

    <div class="project-card__footer">
      <div class="project-card__meta">
        <strong class="project-card__title">{{ project.name }}</strong>
        <span class="project-card__date">{{ project.updatedAt }}</span>
      </div>

      <div class="project-card__actions-col" aria-hidden="true">
        <div class="project-card__actions">
          <button type="button" class="project-card__action" @click.stop="handleActionClick">
            <span class="project-card__action-tip">添加</span>
            <FigmaIcon name="card-add" :size="14" />
          </button>
          <button type="button" class="project-card__action" @click.stop="handleEditClick">
            <span class="project-card__action-tip">编辑</span>
            <FigmaIcon name="card-edit" :size="14" />
          </button>
          <button type="button" class="project-card__action" @click.stop="handleActionClick">
            <span class="project-card__action-tip">导出</span>
            <FigmaIcon name="card-upload" :size="14" />
          </button>
          <button type="button" class="project-card__action" @click.stop="handleDeleteClick">
            <span class="project-card__action-tip">删除</span>
            <FigmaIcon name="card-delete" :size="14" />
          </button>
        </div>
        <span class="project-card__time">{{ formatDuration(project.duration) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { Project } from '@/types/project'

const props = defineProps<{
  project: Project
  batchMode?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-select', id: string): void
  (e: 'delete', id: string): void
}>()

const router = useRouter()

const formatDuration = (duration?: string): string => {
  return duration?.trim() || '00:45:00'
}

const handleActionClick = (): void => {}

const handleEditClick = (): void => {
  void router.push(`/projects/${props.project.id}/editor/${props.project.currentStep}`)
}

const handleDeleteClick = (): void => {
  emit('delete', props.project.id)
}

const handleCardClick = (): void => {
  if (props.batchMode) {
    emit('toggle-select', props.project.id)
  }
}
</script>
