<template>
  <header class="setting-toolbar">
    <button class="setting-toolbar__model" type="button">
      <FigmaIcon name="model-openai" :size="18" />
      <span>Gpt 4.0</span>
      <FigmaIcon name="chevron-down" :size="14" />
    </button>

    <label class="setting-toolbar__search">
      <input v-model="keywordProxy" type="text" placeholder="搜索名称" />
      <FigmaIcon name="search" :size="16" />
    </label>

    <button class="setting-toolbar__btn" type="button" @click="$emit('add')">
      <FigmaIcon name="card-add" :size="14" />
      <span>添加</span>
    </button>
    <button class="setting-toolbar__btn" type="button" @click="$emit('batch')">
      <FigmaIcon name="batch" :size="16" />
      <span>批量</span>
    </button>

    <div class="setting-toolbar__spacer"></div>

    <button class="setting-toolbar__outline" type="button" @click="$emit('save-export')">保存并导出</button>
    <button class="setting-toolbar__primary" type="button" @click="$emit('next')">进入图片生成</button>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

const props = defineProps<{
  keyword: string
}>()

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'add'): void
  (e: 'batch'): void
  (e: 'save-export'): void
  (e: 'next'): void
}>()

const keywordProxy = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
})
</script>
