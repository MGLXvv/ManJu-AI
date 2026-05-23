<template>
  <header class="top-nav">
    <RouterLink class="top-nav__logo" to="/">LOGO</RouterLink>
    <nav class="top-nav__items" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.to" class="top-nav__item" :to="item.to">
        <component :is="item.icon" :size="28" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <RouterLink class="top-nav__user" to="/user">头像<span>用户</span></RouterLink>
  </header>
</template>

<script setup lang="ts">
import { Blocks, CircleDollarSign, Database, Home, MicVocal, Settings, Users, WalletCards } from 'lucide-vue-next'

const navItems = [
  { label: '首页', to: '/', icon: Home },
  { label: '资源库', to: '/resources', icon: Database },
  { label: '音色管理', to: '/voices', icon: MicVocal },
  { label: '团队空间', to: '/team', icon: Users },
  { label: '积分商城', to: '/points', icon: WalletCards },
  { label: '算力充值', to: '/billing', icon: CircleDollarSign },
  { label: '系统管理', to: '/system', icon: Blocks },
]
</script>
