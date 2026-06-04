<template>
  <div ref="gridWrapRef" class="asset-grid-wrap">
    <div class="asset-grid">
      <div
        v-for="(row, rowIndex) in assetRows"
        :key="`row-${rowIndex}`"
        class="asset-grid__row"
        :class="{ 'asset-grid__row--has-expanded': rowHasExpanded(row) }"
      >
        <AssetCard
          v-for="asset in row"
          :key="asset.id"
          :asset="asset"
          :is-selected="asset.id === selectedAssetId && asset.status !== 'generating'"
          :is-expanded="isExpandedAsset(asset)"
          :batch-mode="batchMode"
          :is-batch-selected="(batchSelectedIds ?? []).includes(asset.id)"
          @generate="$emit('generate', $event)"
          @upload="$emit('upload', $event)"
          @select-candidate="$emit('select-candidate', $event)"
          @update="$emit('update', $event)"
          @select="$emit('select', $event)"
          @toggle-batch="$emit('toggle-batch', $event)"
          @preview="$emit('preview', $event)"
          @favorite="$emit('favorite', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AssetCard from './AssetCard.vue'
import type { SettingAsset } from '@/types/settingAsset'

const props = defineProps<{
  assets: SettingAsset[]
  selectedAssetId: string
  batchMode?: boolean
  batchSelectedIds?: string[]
}>()

const CARD_WIDTH = 330
const CARD_GAP = 16
const gridWrapRef = ref<HTMLElement | null>(null)
const rowSize = ref(5)
let resizeObserver: ResizeObserver | null = null

const isExpandedAsset = (asset: SettingAsset): boolean => {
  return (
    !props.batchMode &&
    asset.id === props.selectedAssetId &&
    asset.status !== 'generating'
  )
}

const assetRows = computed(() => {
  const rows: SettingAsset[][] = []
  for (let index = 0; index < props.assets.length; index += rowSize.value) {
    rows.push(props.assets.slice(index, index + rowSize.value))
  }
  return rows
})

const rowHasExpanded = (row: SettingAsset[]): boolean => {
  return row.some((asset) => isExpandedAsset(asset))
}

const recalcRowSize = (): void => {
  const width = gridWrapRef.value?.clientWidth ?? 0
  if (width <= 0) {
    rowSize.value = 5
    return
  }

  const fitCount = Math.floor((width + CARD_GAP) / (CARD_WIDTH + CARD_GAP))
  rowSize.value = Math.max(1, fitCount)
}

onMounted(() => {
  recalcRowSize()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      recalcRowSize()
    })
    if (gridWrapRef.value) {
      resizeObserver.observe(gridWrapRef.value)
    }
  } else {
    window.addEventListener('resize', recalcRowSize)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  } else {
    window.removeEventListener('resize', recalcRowSize)
  }
})

defineEmits<{
  (e: 'generate', id: string): void
  (e: 'upload', payload: { id: string; imageUrl: string }): void
  (e: 'select-candidate', payload: { id: string; imageUrl: string }): void
  (e: 'update', payload: { id: string; patch: Partial<SettingAsset> }): void
  (e: 'select', id: string): void
  (e: 'toggle-batch', id: string): void
  (e: 'preview', asset: SettingAsset): void
  (e: 'favorite', id: string): void
  (e: 'delete', id: string): void
}>()
</script>
