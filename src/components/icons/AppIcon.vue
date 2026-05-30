<template>
  <span
    v-if="iconFontClass"
    class="app-icon app-icon--font"
    :class="iconFontClass"
    :title="title"
    :style="iconStyle"
    aria-hidden="true"
  />
  <img
    v-else
    class="app-icon app-icon--svg"
    :src="iconUrl"
    :alt="alt"
    :title="title"
    :style="iconStyle"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveAppIconFontClass, resolveAppIconUrl, type AppIconName } from './iconRegistry'

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
    title?: string
    alt?: string
  }>(),
  {
    size: 20,
    title: '',
    alt: '',
  },
)

const iconStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size}px`,
  lineHeight: `${props.size}px`,
}))

const iconFontClass = computed(() => resolveAppIconFontClass(props.name))
const iconUrl = computed(() => resolveAppIconUrl(props.name))
</script>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
}

.app-icon--font {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-align: center;
  line-height: 1;
}

.app-icon--font::before {
  display: block;
  line-height: 1;
  transform: translateY(0.02em);
}

.app-icon--svg {
  object-fit: contain;
  vertical-align: middle;
}
</style>
