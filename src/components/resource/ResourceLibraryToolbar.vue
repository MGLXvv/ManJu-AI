<template>
  <header class="resource-toolbar">
    <div class="resource-toolbar__left">
      <button type="button" class="resource-toolbar__library">{{ libraryName }} <span>⌄</span></button>

      <label class="resource-toolbar__search">
        <input :value="keyword" :placeholder="searchPlaceholder" @input="onKeywordInput" />
        <FigmaIcon name="search" :size="18" />
      </label>
    </div>

    <div class="resource-toolbar__right">
      <label class="resource-toolbar__select-wrap">
        <select :value="sourceFilter" class="resource-toolbar__select" @change="onSourceChange">
          <option value="all">资产来源</option>
          <option value="created">我的创建</option>
          <option value="favorite">我的收藏</option>
          <option value="official">官方主体</option>
        </select>
      </label>

      <label class="resource-toolbar__select-wrap">
        <select :value="typeFilter" class="resource-toolbar__select" @change="onTypeChange">
          <option value="all">资产类型</option>
          <option value="character">角色</option>
          <option value="scene">场景</option>
        </select>
      </label>

      <button type="button" class="resource-toolbar__batch" @click="$emit('export')">导出资源</button>
      <button type="button" class="resource-toolbar__batch" @click="$emit('reuse')">复用到项目</button>
      <button type="button" class="resource-toolbar__batch" @click="$emit('batch')">{{ batchLabel }}</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { ResourceSourceFilter, ResourceTypeFilter } from '@/types/resource'

withDefaults(
  defineProps<{
    libraryName?: string
    keyword: string
    sourceFilter: ResourceSourceFilter
    typeFilter: ResourceTypeFilter
    batchLabel?: string
    searchPlaceholder?: string
  }>(),
  {
    libraryName: 'xxx用户的个人资源库',
    batchLabel: '批量操作',
    searchPlaceholder: '请输入提示词、主体、故事板',
  },
)

const emit = defineEmits<{
  (e: 'update:keyword', value: string): void
  (e: 'update:sourceFilter', value: ResourceSourceFilter): void
  (e: 'update:typeFilter', value: ResourceTypeFilter): void
  (e: 'export'): void
  (e: 'reuse'): void
  (e: 'batch'): void
}>()

const onKeywordInput = (event: Event): void => {
  const target = event.target as HTMLInputElement | null
  emit('update:keyword', target?.value ?? '')
}

const onSourceChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  emit('update:sourceFilter', target.value as ResourceSourceFilter)
}

const onTypeChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  emit('update:typeFilter', target.value as ResourceTypeFilter)
}
</script>
