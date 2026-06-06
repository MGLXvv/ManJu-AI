<template>
  <section class="storyboard-tag-group">
    <header class="storyboard-tag-group__header">{{ title }}</header>

    <div class="storyboard-tag-group__list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="storyboard-tag-group__chip"
        :class="{ 'is-selected': selectedId === item.id }"
        @click="selectItem(item.id)"
      >
        <span>{{ item.name }}</span>
        <span
          class="storyboard-tag-group__remove"
          role="button"
          tabindex="0"
          aria-label="删除标签"
          @click.stop="removeItem(item.id)"
          @keydown.enter.stop.prevent="removeItem(item.id)"
          @keydown.space.stop.prevent="removeItem(item.id)"
        >
          ×
        </span>
      </button>

      <div v-if="availableOptions.length > 0" class="storyboard-tag-group__add-wrap">
        <button type="button" class="storyboard-tag-group__add" @click="open = !open">+</button>
        <div v-if="open" class="storyboard-tag-group__menu">
          <button
            v-for="option in availableOptions"
            :key="option.id"
            type="button"
            class="storyboard-tag-group__menu-item"
            @click="selectOption(option.id)"
          >
            {{ option.name }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StoryboardTag } from '@/types/storyboard'

const props = defineProps<{
  title: string
  items: StoryboardTag[]
  options: StoryboardTag[]
}>()

const emit = defineEmits<{
  (e: 'add', id: string): void
  (e: 'remove', id: string): void
}>()

const open = ref(false)
const selectedId = ref('')

const availableOptions = computed(() => {
  const selected = new Set(props.items.map((item) => item.id))
  return props.options.filter((item) => !selected.has(item.id))
})

const selectItem = (id: string): void => {
  selectedId.value = id
}

const removeItem = (id: string): void => {
  emit('remove', id)
}

const selectOption = (id: string): void => {
  emit('add', id)
  selectedId.value = id
  open.value = false
}

watch(
  () => props.items,
  (items) => {
    if (!items.some((item) => item.id === selectedId.value)) {
      selectedId.value = items[0]?.id ?? ''
    }
    if (availableOptions.value.length === 0) {
      open.value = false
    }
  },
  { immediate: true, deep: true },
)
</script>
