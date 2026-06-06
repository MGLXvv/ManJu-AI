<template>
  <aside class="storyboard-reference-rail" :class="{ 'is-collapsed': collapsed }">
    <button
      type="button"
      class="storyboard-reference-rail__toggle"
      :aria-label="collapsed ? '展开参考图列表' : '收起参考图列表'"
      @click="toggleCollapse"
    >
      <svg
        v-if="collapsed"
        width="19"
        height="35"
        viewBox="0 0 19 35"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M17.4218 1.00012L7.85341 15.4819C7.19075 16.4849 7.19075 17.7865 7.85341 18.7895L17.4218 33.2713"
          stroke="#D2D2D2"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M7.9134 5.61011L1.4846 15.5006C0.838376 16.4948 0.838377 17.7763 1.4846 18.7705L7.9134 28.661"
          stroke="#D2D2D2"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <svg
        v-else
        width="19"
        height="35"
        viewBox="0 0 19 35"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M1.00012 1.00012L10.5685 15.4819C11.2311 16.4849 11.2311 17.7865 10.5685 18.7895L1.00012 33.2713"
          stroke="#D2D2D2"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          d="M10.5085 5.61011L16.9373 15.5006C17.5835 16.4948 17.5835 17.7763 16.9373 18.7705L10.5085 28.661"
          stroke="#D2D2D2"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <div v-if="!collapsed" class="storyboard-reference-rail__list">
      <button
        v-for="image in images"
        :key="image.id"
        type="button"
        class="storyboard-reference-rail__item"
        :class="{ 'is-active': image.url === activeImageUrl }"
        @click="$emit('select', image.id)"
      >
        <img :src="image.url" :alt="image.label || image.id" />
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
    activeImageUrl?: string
  }>(),
  {
    collapsed: false,
    activeImageUrl: '',
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
