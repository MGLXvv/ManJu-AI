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
      <button type="button" class="batch-selection-toolbar__action" :disabled="actionDisabled" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    selectedCount: number
    totalCount: number
    actionLabel: string
    actionDisabled?: boolean
    primaryLabel?: string
    primarySelected?: boolean
    secondaryLabel?: string
    secondarySelected?: boolean
  }>(),
  {
    actionDisabled: false,
    primaryLabel: '本页全选',
    primarySelected: false,
    secondaryLabel: undefined,
    secondarySelected: false,
  },
)

defineEmits<{
  (e: 'exit'): void
  (e: 'toggle-primary'): void
  (e: 'toggle-secondary'): void
  (e: 'action'): void
}>()
</script>
