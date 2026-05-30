<template>
  <article class="project-create-card">
    <button class="project-create-card__action" type="button" @click="$emit('create')">
      <span class="project-create-card__icon project-create-card__icon--plus" aria-hidden="true">+</span>
      <span>新建项目</span>
    </button>

    <button class="project-create-card__action" type="button" @click="$emit('import')">
      <span class="project-create-card__icon">
        <FigmaIcon name="project-import" :size="20" />
      </span>
      <span>导入项目</span>
    </button>
  </article>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'create'): void
  (e: 'import'): void
}>()
</script>

