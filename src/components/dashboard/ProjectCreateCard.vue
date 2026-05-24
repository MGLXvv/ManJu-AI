<template>
  <article class="project-create-card">
    <button class="project-create-card__action" type="button" @click="$emit('create')">
      <FigmaIcon name="toolbar-create" :size="20" />
      <span>新建项目</span>
    </button>

    <button class="project-create-card__action" type="button" @click="$emit('import')">
      <FigmaIcon name="toolbar-import" :size="20" />
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
