<template>
  <aside class="storyboard-reference-rail" :class="{ 'is-collapsed': collapsed }">
    <button
      type="button"
      class="storyboard-reference-rail__toggle"
      :aria-label="collapsed ? '展开参考图列表' : '收起参考图列表'"
      @click="toggleCollapse"
    >
      {{ collapsed ? '‹' : '›' }}
    </button>

    <div v-if="!collapsed" class="storyboard-reference-rail__list">
      <button
        v-for="image in images"
        :key="image.id"
        type="button"
        class="storyboard-reference-rail__item"
        @click="$emit('select', image.id)"
      >
        <img :src="image.url" :alt="image.id" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { StoryboardReferenceImage } from '@/types/storyboard'

const props = withDefaults(
  defineProps<{
    images: StoryboardReferenceImage[]
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-collapse', collapsed: boolean): void
}>()

const toggleCollapse = (): void => {
  emit('toggle-collapse', !props.collapsed)
}
</script>
