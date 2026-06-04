<template>
  <section class="system-message-panel">
    <header class="system-message-panel__toolbar">
      <label class="system-message-panel__filter">
        <select :value="filter" @change="onFilterChange">
          <option value="all">所有消息</option>
          <option value="unread">未读消息</option>
          <option value="read">已读消息</option>
        </select>
      </label>

      <div class="system-message-panel__actions">
        <button type="button" @click="$emit('clear')">清空消息</button>
        <button type="button" @click="$emit('mark-all-read')">全部标为已读</button>
      </div>
    </header>

    <div class="system-message-panel__list">
      <article v-for="item in items" :key="item.id" class="system-message-item" :class="`is-${item.status}`">
        <div class="system-message-item__main">
          <div class="system-message-item__title-row">
            <span class="system-message-item__dot" :class="`is-${item.level}`"></span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.relativeTime }}</small>
          </div>
          <p>{{ item.summary }}......</p>
        </div>

        <button type="button" class="system-message-item__detail" @click="$emit('open-detail', item.id)">查看详情</button>
      </article>

      <div v-if="!items.length" class="system-message-panel__empty">当前筛选条件下没有消息。</div>
    </div>

    <footer class="project-pagination">
      <span class="system-message-panel__pagination-total">共 {{ pageCount }} 页</span>
      <button type="button" class="project-pagination__arrow is-plain" :disabled="page <= 1" @click="$emit('update:page', page - 1)">‹</button>
      <button
        v-for="pageNumber in pages"
        :key="pageNumber"
        type="button"
        class="project-pagination__item"
        :class="{ 'is-active': pageNumber === page }"
        @click="$emit('update:page', pageNumber)"
      >
        {{ pageNumber }}
      </button>
      <button type="button" class="project-pagination__arrow is-plain" :disabled="page >= pageCount" @click="$emit('update:page', page + 1)">›</button>

      <div class="project-pagination__jump-wrap">
        <select class="project-pagination__select" :value="page" @change="onPageSelect">
          <option v-for="pageNumber in pages" :key="`jump-${pageNumber}`" :value="pageNumber">{{ pageNumber }}/页</option>
        </select>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SystemMessageFilter, SystemMessageItem } from '@/types/system'

const props = defineProps<{
  items: SystemMessageItem[]
  filter: SystemMessageFilter
  page: number
  pageCount: number
}>()

const emit = defineEmits<{
  (e: 'update:filter', value: SystemMessageFilter): void
  (e: 'update:page', value: number): void
  (e: 'clear'): void
  (e: 'mark-all-read'): void
  (e: 'open-detail', id: string): void
}>()

const pages = computed(() => Array.from({ length: props.pageCount }, (_, index) => index + 1))

const onFilterChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  emit('update:filter', target.value as SystemMessageFilter)
}

const onPageSelect = (event: Event): void => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  emit('update:page', Number(target.value))
}
</script>
