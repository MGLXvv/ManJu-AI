<template>
  <section class="storyboard-tag-group">
    <header class="storyboard-tag-group__header">{{ title }}</header>

    <div class="storyboard-tag-group__list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="storyboard-tag-group__chip"
        @click="$emit('remove', item.id)"
      >
        <span>{{ item.name }}</span>
        <span class="storyboard-tag-group__remove">×</span>
      </button>

      <div class="storyboard-tag-group__add-wrap">
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
import { computed, ref } from 'vue'
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

const availableOptions = computed(() => {
  const selected = new Set(props.items.map((item) => item.id))
  return props.options.filter((item) => !selected.has(item.id))
})

const selectOption = (id: string): void => {
  emit('add', id)
  open.value = false
}
</script>
