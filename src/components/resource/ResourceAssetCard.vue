<template>
  <article class="resource-card" :class="[`resource-card--${asset.type}`, { 'is-batch-mode': batchMode, 'is-batch-selected': selected }]">
    <button
      v-if="batchMode"
      type="button"
      class="resource-card__check"
      :class="{ 'is-active': selected }"
      aria-label="选择资产"
      @click.stop="$emit('toggle-select', asset.id)"
    >
      <span></span>
    </button>

    <header class="resource-card__head">
      <span>{{ asset.type === 'character' ? '角色' : '场景' }}</span>
    </header>

    <button type="button" class="resource-card__body" @click="handleClick">
      <div class="resource-card__preview">
        <img v-if="asset.imageUrl" :src="asset.imageUrl" :alt="asset.name" />
      </div>
      <strong class="resource-card__name">{{ asset.name }}</strong>
    </button>
  </article>
</template>

<script setup lang="ts">
import type { ResourceAsset } from '@/types/resource'

const props = defineProps<{
  asset: ResourceAsset
  batchMode?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'toggle-select', id: string): void
}>()

const handleClick = (): void => {
  if (props.batchMode) {
    emit('toggle-select', props.asset.id)
    return
  }

  emit('edit', props.asset.id)
}
</script>
