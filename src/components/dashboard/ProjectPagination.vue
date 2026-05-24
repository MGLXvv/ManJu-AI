<template>
  <nav class="project-pagination" aria-label="项目分页">
    <button class="project-pagination__arrow" type="button" :disabled="modelValue <= 1" @click="$emit('update:modelValue', modelValue - 1)">
      ‹
    </button>

    <button
      v-for="page in pages"
      :key="page"
      class="project-pagination__item"
      :class="{ 'is-active': page === modelValue }"
      type="button"
      @click="$emit('update:modelValue', page)"
    >
      {{ page }}
    </button>

    <button class="project-pagination__arrow" type="button" :disabled="modelValue >= pages.length" @click="$emit('update:modelValue', modelValue + 1)">
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
const props = defineProps<{
  modelValue: number
  pages: number[]
  pageSize: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

const onSizeChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  const nextSize = Number(target?.value ?? props.pageSize)
  emit('update:pageSize', nextSize)
}
</script>
