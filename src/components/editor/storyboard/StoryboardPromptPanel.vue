<template>
  <aside class="storyboard-prompt-panel">
    <div class="storyboard-prompt-panel__card">
      <StoryboardTagGroup
        title="角色"
        :items="shot.characters"
        :options="tagOptions.characters"
        @add="$emit('add-tag', 'character', $event)"
        @remove="$emit('remove-tag', 'character', $event)"
      />

      <StoryboardTagGroup
        title="场景"
        :items="shot.scenes"
        :options="tagOptions.scenes"
        @add="$emit('add-tag', 'scene', $event)"
        @remove="$emit('remove-tag', 'scene', $event)"
      />

      <StoryboardTagGroup
        title="道具"
        :items="shot.props"
        :options="tagOptions.props"
        @add="$emit('add-tag', 'prop', $event)"
        @remove="$emit('remove-tag', 'prop', $event)"
      />

      <StoryboardTextArea
        title="画面描述"
        :model-value="shot.prompt"
        placeholder="请输入镜头描述，例如人物动作、机位、情绪、光线氛围等。"
        @update:model-value="$emit('update-prompt', $event)"
      />

      <StoryboardSelectRow
        :style="shot.style"
        :styles="styleOptions"
        :ratio="shot.ratio"
        @update:style="$emit('update-style', $event)"
        @update:ratio="$emit('update-ratio', $event)"
      />

      <button type="button" class="storyboard-prompt-panel__generate" @click="$emit('generate-shot')">生成镜头</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import StoryboardSelectRow from './StoryboardSelectRow.vue'
import StoryboardTagGroup from './StoryboardTagGroup.vue'
import StoryboardTextArea from './StoryboardTextArea.vue'
import type { StoryboardShot, StoryboardTagOptions, StoryboardTagType } from '@/types/storyboard'

defineProps<{
  shot: StoryboardShot
  tagOptions: StoryboardTagOptions
  styleOptions: string[]
}>()

defineEmits<{
  (e: 'add-tag', type: StoryboardTagType, tagId: string): void
  (e: 'remove-tag', type: StoryboardTagType, tagId: string): void
  (e: 'update-prompt', prompt: string): void
  (e: 'update-style', style: string): void
  (e: 'update-ratio', ratio: '16:9' | '9:16'): void
  (e: 'generate-shot'): void
}>()
</script>
