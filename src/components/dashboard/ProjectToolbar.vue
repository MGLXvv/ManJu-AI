<template>
  <header class="project-toolbar">
    <div class="project-toolbar__left">
      <ProjectStatusTabs v-model="statusProxy" />
    </div>

    <div class="project-toolbar__right">
      <ProjectSearchBox v-model="keywordProxy" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProjectSearchBox from './ProjectSearchBox.vue'
import ProjectStatusTabs from './ProjectStatusTabs.vue'
import type { ProjectStatus } from '@/types/project'

const props = defineProps<{
  status: 'all' | ProjectStatus
  keyword: string
}>()

const emit = defineEmits<{
  (e: 'update:status', value: 'all' | ProjectStatus): void
  (e: 'update:keyword', value: string): void
}>()

const statusProxy = computed({
  get: () => props.status,
  set: (value: 'all' | ProjectStatus) => emit('update:status', value),
})

const keywordProxy = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
})
</script>
