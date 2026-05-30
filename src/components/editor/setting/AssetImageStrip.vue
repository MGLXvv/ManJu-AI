<template>
  <div class="asset-image-strip">
    <button
      v-if="hasImages"
      class="asset-image-strip__preview"
      type="button"
      aria-label="预览"
      @click="$emit('preview')"
    >
      <FigmaIcon name="tool-zoom" :size="14" />
    </button>

    <div v-if="hasImages" class="asset-image-strip__grid">
      <div v-for="item in tiles" :key="item.index" class="asset-image-strip__tile">
        <img v-if="item.image" :src="item.image" :alt="`素材图片 ${item.index + 1}`" />
        <span class="asset-image-strip__tile-label">{{ item.label }}</span>
      </div>
    </div>

    <div v-else class="asset-image-strip__empty">
      <FigmaIcon name="create-blank-shot" :size="22" />
      <span>等待生成图片</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

defineEmits<{
  (e: 'preview'): void
}>()

const props = defineProps<{
  images: string[]
  title: string
}>()

const hasImages = computed(() => props.images.some((item) => item.trim().length > 0))

const tiles = computed(() => {
  const base = props.images.slice(0, 4).map((image, index) => ({
    image,
    index,
    label: `${props.title}-${index + 1}`,
  }))

  while (base.length < 4) {
    const index = base.length
    base.push({
      image: '',
      index,
      label: `${props.title}-${index + 1}`,
    })
  }

  return base
})
</script>
