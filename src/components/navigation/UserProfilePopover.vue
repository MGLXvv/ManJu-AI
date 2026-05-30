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
        :class="{ 'is-active': item.key === 'messages' }"
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
import type { AppIconName } from '@/components/icons/iconRegistry'

type MenuKey = 'messages' | 'password' | 'space' | 'team' | 'logout'

const menuItems: Array<{ key: MenuKey; label: string; icon: AppIconName }> = [
  { key: 'messages', label: '消息通知 (6)', icon: 'user-menu-notify' },
  { key: 'password', label: '修改密码', icon: 'user-menu-password' },
  { key: 'space', label: '资源库个人空间', icon: 'user-menu-space' },
  { key: 'team', label: '切换团队空间', icon: 'user-menu-switch-team' },
  { key: 'logout', label: '退出登录', icon: 'user-menu-logout' },
]

defineEmits<{
  (e: 'select', key: MenuKey): void
}>()
</script>
