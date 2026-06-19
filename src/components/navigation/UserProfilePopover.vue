<template>
  <div class="user-popover" role="menu">
    <div class="user-popover__profile">
      <div class="user-popover__avatar" aria-hidden="true">
        <FigmaIcon name="topbar-user-default" :size="30" />
      </div>

      <div class="user-popover__meta">
        <strong class="user-popover__name">默认用户001</strong>
        <span class="user-popover__phone">18212345678</span>
      </div>
    </div>

    <div class="user-popover__divider"></div>

    <nav class="user-popover__menu" aria-label="用户菜单">
      <button
        v-for="item in menuItems"
        :key="item.key"
        type="button"
        class="user-popover__item"
        :class="{ 'is-active': activeKey === item.key }"
        role="menuitem"
        @click="$emit('select', item.key)"
      >
        <span class="user-popover__item-icon" aria-hidden="true">
          <FigmaIcon :name="item.icon" :size="16" />
          <span v-if="item.key === 'messages'" class="user-popover__notify-dot"></span>
        </span>
        <span class="user-popover__item-label">{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { buildUserMenuItems, type UserMenuKey as MenuKey } from '@/features/navigation/appNavigationState'

const menuItems = buildUserMenuItems()

defineProps<{
  activeKey?: MenuKey | null
}>()

defineEmits<{
  (e: 'select', key: MenuKey): void
}>()
</script>
