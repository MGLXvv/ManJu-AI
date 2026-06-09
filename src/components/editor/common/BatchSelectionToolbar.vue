<template>
  <div class="batch-selection-toolbar">
    <div class="batch-selection-toolbar__meta">
      <button type="button" class="batch-selection-toolbar__exit" @click="$emit('exit')">退出批量</button>
      <span class="batch-selection-toolbar__count">已选 {{ selectedCount }} / {{ totalCount }}</span>
    </div>

    <div class="batch-selection-toolbar__actions">
      <button
        type="button"
        class="batch-selection-toolbar__toggle"
        :class="{ 'is-active': primarySelected }"
        @click="$emit('toggle-primary')"
      >
        {{ primaryLabel }}
      </button>
      <button
        v-if="secondaryLabel"
        type="button"
        class="batch-selection-toolbar__toggle"
        :class="{ 'is-active': secondarySelected }"
        @click="$emit('toggle-secondary')"
      >
        {{ secondaryLabel }}
      </button>
      <template v-if="actions?.length">
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="batch-selection-toolbar__action"
          :class="{
            'is-secondary': action.tone === 'secondary',
            'is-danger': action.tone === 'danger',
          }"
          :disabled="action.disabled"
          @click="$emit('action', action.key)"
        >
          <AppIcon v-if="action.icon" :name="action.icon" :size="16" />
          <span>{{ action.label }}</span>
        </button>
      </template>
      <button
        v-else
        type="button"
        class="batch-selection-toolbar__action"
        :disabled="actionDisabled"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import type { AppIconName } from '@/components/icons/iconRegistry'

interface BatchToolbarAction {
  key: string
  label: string
  icon?: AppIconName
  disabled?: boolean
  tone?: 'primary' | 'secondary' | 'danger'
}

withDefaults(
  defineProps<{
    selectedCount: number
    totalCount: number
    actionLabel?: string
    actionDisabled?: boolean
    primaryLabel?: string
    primarySelected?: boolean
    secondaryLabel?: string
    secondarySelected?: boolean
    actions?: BatchToolbarAction[]
  }>(),
  {
    actionLabel: '执行操作',
    actionDisabled: false,
    primaryLabel: '本页全选',
    primarySelected: false,
    secondaryLabel: undefined,
    secondarySelected: false,
    actions: undefined,
  },
)

defineEmits<{
  (e: 'exit'): void
  (e: 'toggle-primary'): void
  (e: 'toggle-secondary'): void
  (e: 'action', actionKey?: string): void
}>()
</script>
