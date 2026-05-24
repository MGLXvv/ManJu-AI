<template>
  <Teleport to="body">
    <div v-if="open && asset" class="asset-preview-modal">
      <div class="asset-preview-modal__overlay" @click="close"></div>
      <section class="asset-preview-modal__dialog" role="dialog" aria-modal="true" aria-label="资产预览">
        <header class="asset-preview-modal__header">
          <h2>{{ asset.title }}</h2>
          <button type="button" aria-label="关闭" @click="close">×</button>
        </header>

        <img class="asset-preview-modal__image" :src="asset.imageUrls[0]" alt="预览图" />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { SettingAsset } from '@/types/settingAsset'

const open = defineModel<boolean>('open', { required: true })

defineProps<{
  asset: SettingAsset | null
}>()

const close = (): void => {
  open.value = false
}
</script>
