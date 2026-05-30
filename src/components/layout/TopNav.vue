<template>
  <header class="top-nav">
    <RouterLink class="top-nav__logo" to="/">LOGO</RouterLink>
    <nav class="top-nav__items" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.to" class="top-nav__item" :to="item.to">
        <FigmaIcon :name="item.icon" :size="28" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <RouterLink class="top-nav__user" to="/user">
      <FigmaIcon name="topbar-user-default" :size="20" />
      <span>用户</span>
    </RouterLink>
  </header>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { AppIconName } from '@/components/icons/iconRegistry'

const navItems: Array<{ label: string; to: string; icon: AppIconName }> = [
  { label: '首页', to: '/', icon: 'topbar-home-default' },
  { label: '资源库', to: '/resources', icon: 'topbar-resource-default' },
  { label: '音色管理', to: '/voices', icon: 'topbar-voice-default' },
  { label: '团队空间', to: '/team', icon: 'topbar-team-default' },
  { label: '积分商城', to: '/points', icon: 'topbar-points-default' },
  { label: '算力充值', to: '/billing', icon: 'topbar-credit-cart-default' },
  { label: '系统管理', to: '/system', icon: 'topbar-system-default' },
]
</script>
