<template>
  <header class="project-toolbar">
    <div class="project-toolbar__left">
      <ProjectStatusTabs
        v-model="statusProxy"
        :total="total"
        :in-progress="inProgress"
        :completed="completed"
      />
    </div>

    <div class="project-toolbar__right">
      <ProjectSearchBox v-model="keywordProxy" />
      <button class="project-batch-btn" type="button" @click="$emit('batch')">
        <FigmaIcon name="batch" :size="18" />
        <span>批量</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { ProjectStatus } from '@/types/project'
import ProjectSearchBox from './ProjectSearchBox.vue'
import ProjectStatusTabs from './ProjectStatusTabs.vue'

const props = defineProps<{
  status: 'all' | ProjectStatus
  keyword: string
  total: number
  inProgress: number
  completed: number
}>()

const emit = defineEmits<{
  (e: 'update:status', value: 'all' | ProjectStatus): void
  (e: 'update:keyword', value: string): void
  (e: 'batch'): void
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
