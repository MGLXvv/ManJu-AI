<template>
  <div class="storyboard-canvas-toolbar">
    <button
      v-for="tool in tools"
      :key="tool.key"
      type="button"
      class="storyboard-canvas-toolbar__button"
      :class="{
        'is-disabled': !tool.enabled,
        'is-active': tool.active,
      }"
      :disabled="!tool.enabled"
      :aria-label="tool.label"
      :title="tool.title"
      @click="handleToolClick(tool.event)"
    >
      <span class="storyboard-canvas-toolbar__frame" aria-hidden="true"></span>
      <span class="storyboard-canvas-toolbar__icon" aria-hidden="true">
        <FigmaIcon :name="tool.icon" :size="40" />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { AppIconName } from '@/components/icons/iconRegistry'
import type { StoryboardToolAction, StoryboardToolAvailability } from '@/features/editor/storyboardModeState'

type ToolEvent = 'edit' | 'view' | 'toggle-hidden' | 'lock' | 'zoom' | 'copy' | 'delete'

interface ToolbarToolDefinition {
  key: StoryboardToolAction
  event: ToolEvent
  label: string
  icon: AppIconName
  enabled: boolean
  active: boolean
  title: string
}

const props = withDefaults(
  defineProps<{
    isHidden: boolean
    isLocked: boolean
    toolStates: Record<StoryboardToolAction, StoryboardToolAvailability>
    showHiddenToggle?: boolean
  }>(),
  {
    showHiddenToggle: true,
  },
)

const tools = computed<ToolbarToolDefinition[]>(() => {
  const items: ToolbarToolDefinition[] = [
    {
      key: 'edit',
      event: 'edit',
      label: '编辑',
      icon: 'tool-edit',
      enabled: props.toolStates.edit.enabled,
      active: false,
      title: props.toolStates.edit.reason || '打开画布编辑器',
    },
  ]

  if (props.showHiddenToggle) {
    items.push({
      key: 'toggle-hidden',
      event: 'toggle-hidden',
      label: props.isHidden ? '显示' : '隐藏',
      icon: props.isHidden ? 'tool-view-off' : 'tool-view',
      enabled: props.toolStates['toggle-hidden'].enabled,
      active: props.isHidden,
      title: props.toolStates['toggle-hidden'].reason || (props.isHidden ? '恢复当前镜头参与后续流程' : '隐藏当前镜头，不进入下一步'),
    })
  }

  items.push(
    {
      key: 'lock',
      event: 'lock',
      label: props.isLocked ? '解锁' : '锁定',
      icon: props.isLocked ? 'tool-lock-active' : 'tool-lock',
      enabled: props.toolStates.lock.enabled,
      active: props.isLocked,
      title: props.toolStates.lock.reason || (props.isLocked ? '解除当前镜头锁定' : '锁定当前镜头，禁止继续编辑'),
    },
    {
      key: 'zoom',
      event: 'zoom',
      label: '放大',
      icon: 'tool-zoom',
      enabled: props.toolStates.zoom.enabled,
      active: false,
      title: props.toolStates.zoom.reason || '执行超分辨放大',
    },
    {
      key: 'copy',
      event: 'copy',
      label: '复制',
      icon: 'tool-copy',
      enabled: props.toolStates.copy.enabled,
      active: false,
      title: props.toolStates.copy.reason || '复制当前镜头配置',
    },
    {
      key: 'delete',
      event: 'delete',
      label: '删除',
      icon: 'tool-delete',
      enabled: props.toolStates.delete.enabled,
      active: false,
      title: props.toolStates.delete.reason || '移除当前镜头',
    },
  )

  return items
})

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'view'): void
  (e: 'toggle-hidden'): void
  (e: 'lock'): void
  (e: 'zoom'): void
  (e: 'copy'): void
  (e: 'delete'): void
}>()

const handleToolClick = (event: ToolEvent): void => {
  switch (event) {
    case 'edit':
      emit('edit')
      return
    case 'view':
      emit('view')
      return
    case 'toggle-hidden':
      emit('toggle-hidden')
      return
    case 'lock':
      emit('lock')
      return
    case 'zoom':
      emit('zoom')
      return
    case 'copy':
      emit('copy')
      return
    case 'delete':
      emit('delete')
  }
}
</script>
