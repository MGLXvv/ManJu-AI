<template>
  <span class="figma-icon" :style="iconStyle" :title="title" aria-hidden="true"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import spriteUrl from '@/assets/icons/figma-icon-sprite.png'
import {
  FIGMA_ICON_LIBRARY,
  FIGMA_ICON_SPRITE_HEIGHT,
  FIGMA_ICON_SPRITE_WIDTH,
  type FigmaIconName,
} from './figmaIconLibrary'

const props = withDefaults(
  defineProps<{
    name: FigmaIconName
    size?: number
    title?: string
  }>(),
  {
    size: undefined,
    title: '',
  },
)

const transparentIconFiles = import.meta.glob('/src/assets/icons/transparent/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const iconStyle = computed(() => {
  const icon = FIGMA_ICON_LIBRARY[props.name]
  const width = props.size ?? icon.width
  const scale = width / icon.width
  const height = icon.height * scale
  const transparentUrl = transparentIconFiles[`/src/assets/icons/transparent/${props.name}.png`]

  if (transparentUrl) {
    return {
      width: `${width}px`,
      height: `${height}px`,
      backgroundImage: `url("${transparentUrl}")`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
    }
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url("${spriteUrl}")`,
    backgroundSize: `${FIGMA_ICON_SPRITE_WIDTH * scale}px ${FIGMA_ICON_SPRITE_HEIGHT * scale}px`,
    backgroundPosition: `${-icon.x * scale}px ${-icon.y * scale}px`,
  }
})
</script>

<style scoped>
.figma-icon {
  display: inline-block;
  background-repeat: no-repeat;
  flex: none;
}
</style>
