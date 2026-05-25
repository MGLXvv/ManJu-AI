<template>
  <div class="asset-grid-wrap">
    <div class="asset-grid">
      <AssetCard
        v-for="asset in assets"
        :key="asset.id"
        :asset="asset"
        :is-selected="asset.id === selectedAssetId && asset.status !== 'generating'"
        :is-expanded="asset.id === selectedAssetId && asset.status !== 'generating'"
        @generate="$emit('generate', $event)"
        @upload="$emit('upload', $event)"
        @select-candidate="$emit('select-candidate', $event)"
        @update="$emit('update', $event)"
        @select="$emit('select', $event)"
        @preview="$emit('preview', $event)"
        @favorite="$emit('favorite', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AssetCard from './AssetCard.vue'
import type { SettingAsset } from '@/types/settingAsset'

defineProps<{
  assets: SettingAsset[]
  selectedAssetId: string
}>()

defineEmits<{
  (e: 'generate', id: string): void
  (e: 'upload', payload: { id: string; imageUrl: string }): void
  (e: 'select-candidate', payload: { id: string; imageUrl: string }): void
  (e: 'update', payload: { id: string; patch: Partial<SettingAsset> }): void
  (e: 'select', id: string): void
  (e: 'preview', asset: SettingAsset): void
  (e: 'favorite', id: string): void
  (e: 'delete', id: string): void
}>()
</script>
