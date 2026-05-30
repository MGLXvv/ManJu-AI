<template>
  <nav class="project-pagination" aria-label="项目分页">
    <button
      class="project-pagination__arrow is-plain"
      type="button"
      :disabled="modelValue <= 1"
      @click="$emit('update:modelValue', modelValue - 1)"
    >
      <FigmaIcon name="pager-prev" :size="16" />
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
      <FigmaIcon name="pager-next" :size="16" />
    </button>

    <div class="project-pagination__jump-wrap">
      <select class="project-pagination__select" :value="modelValue" @change="onPageSelect">
        <option v-for="page in pages" :key="`jump-${page}`" :value="page">{{ page }}</option>
      </select>
      <FigmaIcon name="chevron-down" :size="14" class="project-pagination__select-icon" />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

const props = defineProps<{
  modelValue: number
  pages: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
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

const onPageSelect = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  const nextPage = Number(target?.value ?? props.modelValue)
  emit('update:modelValue', nextPage)
}
</script>
