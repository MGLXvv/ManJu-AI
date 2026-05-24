<template>
  <div class="asset-image-strip">
    <button class="asset-image-strip__preview" type="button" aria-label="预览" @click="$emit('preview')">
      <Search :size="14" />
    </button>

    <div class="asset-image-strip__grid">
      <div v-for="(image, index) in tiles" :key="index" class="asset-image-strip__tile">
        <img v-if="image" :src="image" alt="素材图片" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'

defineEmits<{
  (e: 'preview'): void
}>()

const props = defineProps<{
  images: string[]
}>()

const tiles = computed(() => {
  const base = props.images.slice(0, 4)
  while (base.length < 4) {
    base.push('')
  }
  return base
})
</script>
