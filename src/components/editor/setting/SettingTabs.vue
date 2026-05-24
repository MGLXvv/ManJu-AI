<template>
  <nav class="setting-tabs" aria-label="资产分类">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="setting-tabs__item"
      :class="{ 'is-active': model === item.value }"
      @click="model = item.value"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SettingAssetTypeFilter } from '@/types/settingAsset'

const props = defineProps<{
  counts: {
    all: number
    character: number
    scene: number
    prop: number
  }
}>()

const model = defineModel<SettingAssetTypeFilter>({ required: true })

const items = computed(() => [
  { value: 'all' as const, label: `全部资产(${props.counts.all})` },
  { value: 'character' as const, label: `角色(${props.counts.character})` },
  { value: 'scene' as const, label: `场景(${props.counts.scene})` },
  { value: 'prop' as const, label: `道具(${props.counts.prop})` },
])
</script>
