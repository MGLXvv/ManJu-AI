<template>
  <div v-if="open" class="resource-library-import-dialog">
    <div class="resource-library-import-dialog__overlay" @click="$emit('close')"></div>
    <div class="resource-library-import-dialog__panel">
      <div class="resource-library-import-dialog__header">
        <div>
          <h3>从资源库导入</h3>
          <p>选择已有角色、场景或道具，导入到当前项目。</p>
        </div>
        <button type="button" class="resource-library-import-dialog__close" @click="$emit('close')">×</button>
      </div>

      <div class="resource-library-import-dialog__filters">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          class="resource-library-import-dialog__filter"
          :class="{ 'is-active': activeType === option.value }"
          @click="$emit('update:type', option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="loading" class="resource-library-import-dialog__state">资源库加载中...</div>
      <div v-else-if="items.length === 0" class="resource-library-import-dialog__state">暂无可导入的资源库素材</div>
      <div v-else class="resource-library-import-dialog__list">
        <article v-for="item in items" :key="item.id" class="resource-library-import-dialog__item">
          <div class="resource-library-import-dialog__thumb">
            <img v-if="item.imageUrls[0]" :src="item.imageUrls[0]" :alt="item.title" />
            <div v-else class="resource-library-import-dialog__thumb-empty">无图</div>
          </div>
          <div class="resource-library-import-dialog__body">
            <div class="resource-library-import-dialog__meta">
              <span class="resource-library-import-dialog__type">{{ typeLabelMap[item.type] }}</span>
              <h4>{{ item.title }}</h4>
            </div>
            <p>{{ item.description || item.prompt || '暂无描述' }}</p>
          </div>
          <button
            type="button"
            class="resource-library-import-dialog__import"
            :disabled="importingId === item.id"
            @click="$emit('import', item.id)"
          >
            {{ importingId === item.id ? '导入中' : '导入' }}
          </button>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResourceLibraryQueryType } from '@/api/modules/editor/resourceLibrary.mapper'
import type { SettingAsset } from '@/types/settingAsset'

defineProps<{
  open: boolean
  loading?: boolean
  items: SettingAsset[]
  activeType: ResourceLibraryQueryType
  importingId?: string
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'update:type', value: ResourceLibraryQueryType): void
  (e: 'import', id: string): void
}>()

const typeOptions: Array<{ label: string; value: ResourceLibraryQueryType }> = [
  { label: '全部', value: 'all' },
  { label: '角色', value: 'character' },
  { label: '场景', value: 'scene' },
  { label: '道具', value: 'prop' },
]

const typeLabelMap: Record<SettingAsset['type'], string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
}
</script>
