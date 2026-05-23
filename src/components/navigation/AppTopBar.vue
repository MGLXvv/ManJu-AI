<template>
  <header class="app-top-bar">
    <RouterLink class="app-top-bar__brand" to="/">
      <span class="app-top-bar__brand-mark">AI</span>
      <span class="app-top-bar__brand-text">漫剧创作台</span>
    </RouterLink>

    <nav class="app-top-bar__nav" aria-label="主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        class="app-top-bar__item"
        :class="{ 'is-active': isActive(item.to) }"
        :to="item.to"
      >
        <FigmaIcon :name="isActive(item.to) ? item.iconActive : item.iconDefault" :size="18" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <RouterLink class="app-top-bar__user" to="/user" aria-label="用户中心">
      <CircleUserRound :size="18" aria-hidden="true" />
      <span>用户</span>
    </RouterLink>
  </header>
</template>

<script setup lang="ts">
import { CircleUserRound } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'

interface NavItem {
  label: string
  to: string
  iconDefault: FigmaIconName
  iconActive: FigmaIconName
}

const route = useRoute()

const navItems: NavItem[] = [
  { label: '首页', to: '/', iconDefault: 'nav-home-default', iconActive: 'nav-home-active' },
  { label: '资源库', to: '/resources', iconDefault: 'nav-resource-default', iconActive: 'nav-resource-active' },
  { label: '音色管理', to: '/voices', iconDefault: 'nav-voice-default', iconActive: 'nav-voice-active' },
  { label: '团队空间', to: '/team', iconDefault: 'nav-team-default', iconActive: 'nav-team-active' },
  { label: '管理充值', to: '/points', iconDefault: 'nav-points-default', iconActive: 'nav-points-active' },
  { label: '系统管理', to: '/system', iconDefault: 'nav-system-default', iconActive: 'nav-system-active' },
]

const isActive = (to: string): boolean => {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>
