<template>
  <aside class="storyboard-prompt-panel" :class="{ 'is-collapsed': collapsed }">
    <div class="storyboard-prompt-panel__card" :class="{ 'is-insert-mode': insertMode }">
      <button
        type="button"
        class="storyboard-prompt-panel__collapse-handle"
        :aria-label="collapsed ? '展开左侧操作台' : '收起左侧操作台'"
        @click="$emit('toggle-collapse')"
      >
        <span aria-hidden="true"></span>
      </button>

      <template v-if="!collapsed">
        <template v-if="insertMode && insertDraft">
          <header class="storyboard-prompt-panel__insert-header">插入新镜头</header>

          <div class="storyboard-prompt-panel__insert-grid">
            <label class="storyboard-prompt-panel__insert-field">
              <span>角色</span>
              <select
                :value="insertDraft.characterIds[0] ?? ''"
                @change="$emit('update-insert-tag', 'character', normalizeSelectValue($event))"
              >
                <option value="">选择角色</option>
                <option v-for="item in tagOptions.characters" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>

            <label class="storyboard-prompt-panel__insert-field">
              <span>场景</span>
              <select
                :value="insertDraft.sceneIds[0] ?? ''"
                @change="$emit('update-insert-tag', 'scene', normalizeSelectValue($event))"
              >
                <option value="">选择场景</option>
                <option v-for="item in tagOptions.scenes" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>

            <label class="storyboard-prompt-panel__insert-field">
              <span>道具</span>
              <select
                :value="insertDraft.propIds[0] ?? ''"
                @change="$emit('update-insert-tag', 'prop', normalizeSelectValue($event))"
              >
                <option value="">选择道具</option>
                <option v-for="item in tagOptions.props" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </label>
          </div>

          <StoryboardTextArea
            title="画面描述"
            :model-value="insertDraft.prompt"
            placeholder="请输入镜头描述，例如人物动作、机位、情绪、光线氛围等。"
            :show-optimize="true"
            :loading="optimizingPrompt"
            @update:model-value="$emit('update-insert-prompt', $event)"
            @optimize="$emit('optimize-insert-prompt')"
          />

          <StoryboardSelectRow
            :style="insertDraft.style"
            :styles="styleOptions"
            :ratio="insertDraft.ratio"
            @update:style="$emit('update-insert-style', $event)"
            @update:ratio="$emit('update-insert-ratio', $event)"
          />

          <div class="storyboard-prompt-panel__insert-actions">
            <button type="button" class="storyboard-prompt-panel__secondary" @click="$emit('cancel-insert')">取消</button>
            <button type="button" class="storyboard-prompt-panel__generate" @click="$emit('confirm-insert')">确定</button>
          </div>
        </template>

        <template v-else>
          <StoryboardTagGroup
            title="角色"
            :items="shot.characters"
            :options="tagOptions.characters"
            :disabled="Boolean(shot.isLocked)"
            @add="$emit('add-tag', 'character', $event)"
            @remove="$emit('remove-tag', 'character', $event)"
          />

          <StoryboardTagGroup
            title="场景"
            :items="shot.scenes"
            :options="tagOptions.scenes"
            :disabled="Boolean(shot.isLocked)"
            @add="$emit('add-tag', 'scene', $event)"
            @remove="$emit('remove-tag', 'scene', $event)"
          />

          <StoryboardTagGroup
            title="道具"
            :items="shot.props"
            :options="tagOptions.props"
            :disabled="Boolean(shot.isLocked)"
            @add="$emit('add-tag', 'prop', $event)"
            @remove="$emit('remove-tag', 'prop', $event)"
          />

          <StoryboardTextArea
            title="画面描述"
            :model-value="shot.prompt"
            placeholder="请输入镜头描述，例如人物动作、机位、情绪、光线氛围等。"
            :disabled="Boolean(shot.isLocked)"
            :show-optimize="true"
            :loading="optimizingPrompt"
            @update:model-value="$emit('update-prompt', $event)"
            @optimize="$emit('optimize-prompt')"
          />

          <StoryboardSelectRow
            :style="shot.style"
            :styles="styleOptions"
            :ratio="shot.ratio"
            :disabled="Boolean(shot.isLocked)"
            @update:style="$emit('update-style', $event)"
            @update:ratio="$emit('update-ratio', $event)"
          />

          <button
            v-if="mode !== 'multi-param'"
            type="button"
            class="storyboard-prompt-panel__generate"
            :disabled="Boolean(shot.isLocked)"
            @click="$emit('generate-shot')"
          >
            生成镜头
          </button>
        </template>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import StoryboardSelectRow from './StoryboardSelectRow.vue'
import StoryboardTagGroup from './StoryboardTagGroup.vue'
import StoryboardTextArea from './StoryboardTextArea.vue'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { StoryboardInsertDraft, StoryboardShot, StoryboardTagOptions, StoryboardTagType } from '@/types/storyboard'

withDefaults(
  defineProps<{
    shot: StoryboardShot
    tagOptions: StoryboardTagOptions
    styleOptions: string[]
    mode?: StoryboardMode
    insertMode?: boolean
    insertDraft?: StoryboardInsertDraft | null
    collapsed?: boolean
    optimizingPrompt?: boolean
  }>(),
  {
    mode: null,
    insertMode: false,
    insertDraft: null,
    collapsed: false,
    optimizingPrompt: false,
  },
)

defineEmits<{
  (e: 'add-tag', type: StoryboardTagType, tagId: string): void
  (e: 'remove-tag', type: StoryboardTagType, tagId: string): void
  (e: 'update-prompt', prompt: string): void
  (e: 'optimize-prompt'): void
  (e: 'update-style', style: string): void
  (e: 'update-ratio', ratio: '16:9' | '9:16'): void
  (e: 'update-insert-tag', type: StoryboardTagType, tagId: string): void
  (e: 'update-insert-prompt', prompt: string): void
  (e: 'optimize-insert-prompt'): void
  (e: 'update-insert-style', style: string): void
  (e: 'update-insert-ratio', ratio: '16:9' | '9:16'): void
  (e: 'confirm-insert'): void
  (e: 'cancel-insert'): void
  (e: 'toggle-collapse'): void
  (e: 'generate-shot'): void
}>()

const normalizeSelectValue = (event: Event): string => (event.target as HTMLSelectElement).value
</script>
