<template>
  <nav class="project-pagination" aria-label="项目分页">
    <button
      class="project-pagination__arrow is-plain"
      type="button"
      :disabled="modelValue <= 1"
      @click="$emit('update:modelValue', modelValue - 1)"
    >
      ‹
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      class="project-pagination__item"
      :class="{ 'is-active': page === modelValue }"
      type="button"
      @click="$emit('update:modelValue', page)"
    >
      {{ page }}
    </button>

    <button
      class="project-pagination__arrow is-plain"
      type="button"
      :disabled="modelValue >= totalPages"
      @click="$emit('update:modelValue', modelValue + 1)"
    >
      ›
    </button>

    <select class="project-pagination__select" :value="pageSize" @change="onSizeChange">
      <option :value="12">12/页</option>
      <option :value="18">18/页</option>
      <option :value="24">24/页</option>
    </select>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  pages: number[]
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

const totalPages = computed(() => Math.max(1, props.pages.length))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = Math.min(Math.max(props.modelValue, 1), total)
  const windowSize = 7

  if (total <= windowSize) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  let start = Math.max(1, current - Math.floor(windowSize / 2))
  let end = start + windowSize - 1

  if (end > total) {
    end = total
    start = end - windowSize + 1
  }

  return Array.from({ length: windowSize }, (_, index) => start + index)
})

const onSizeChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  const nextSize = Number(target?.value ?? props.pageSize)
  emit('update:pageSize', nextSize)
}
</script>
