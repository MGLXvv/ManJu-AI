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
import { buildAppTopNavItems } from '@/features/navigation/appNavigationState'

const navItems = buildAppTopNavItems().map((item) => ({
  label: item.label,
  to: item.to,
  icon: item.iconDefault,
}))
</script>
