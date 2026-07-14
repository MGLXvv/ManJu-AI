<template>
  <div class="resource-grid">
    <button v-if="!batchMode && !creating" type="button" class="resource-grid__create" @click="$emit('create')">
      <span>+</span>
    </button>

    <ResourceAssetEditorCard
      v-else-if="!batchMode && creating"
      mode="create"
      :tab="tab"
      :default-source="defaultSource"
      @save="$emit('save-create', $event)"
      @cancel="$emit('cancel-create')"
    />

    <template v-for="asset in assets" :key="asset.id">
      <ResourceAssetEditorCard
        v-if="editingId === asset.id"
        mode="edit"
        :asset="asset"
        :tab="tab"
        :default-source="defaultSource"
        @save="$emit('save-edit', { id: asset.id, payload: $event })"
        @delete="$emit('delete', asset.id)"
        @cancel="$emit('cancel-edit')"
      />
      <ResourceAssetCard
        v-else
        :asset="asset"
        :batch-mode="batchMode"
        :selected="selectedIds.includes(asset.id)"
        @edit="$emit('edit', $event)"
        @toggle-select="$emit('toggle-select', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import ResourceAssetCard from './ResourceAssetCard.vue'
import ResourceAssetEditorCard from './ResourceAssetEditorCard.vue'
import type { ResourceAsset, ResourceAssetSource, ResourceAssetType, ResourceLibraryTab } from '@/types/resource'

defineProps<{
  assets: ResourceAsset[]
  tab: ResourceLibraryTab
  defaultSource: ResourceAssetSource
  batchMode?: boolean
  selectedIds: string[]
  creating?: boolean
  editingId?: string
}>()

type ResourceEditorPayload = {
  type: ResourceAssetType
  name: string
  prompt: string
  imageUrl: string
  selectedVoiceId?: string
}

defineEmits<{
  (e: 'create'): void
  (e: 'cancel-create'): void
  (e: 'save-create', payload: ResourceEditorPayload): void
  (e: 'edit', id: string): void
  (e: 'cancel-edit'): void
  (e: 'save-edit', payload: { id: string; payload: ResourceEditorPayload }): void
  (e: 'delete', id: string): void
  (e: 'toggle-select', id: string): void
}>()
</script>
