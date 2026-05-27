<template>
  <header class="app-top-bar">
    <RouterLink class="app-top-bar__brand" to="/" aria-label="首页">
      <span class="app-top-bar__brand-glow" aria-hidden="true">ManJu AI</span>
      <span class="app-top-bar__brand-text">ManJu AI</span>
    </RouterLink>

    <div class="app-top-bar__actions">
      <nav class="app-top-bar__quick-nav" aria-label="顶部导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          class="app-top-bar__tool-btn"
          :class="{ 'is-active': isActive(item.to) }"
          :to="item.to"
          :aria-label="item.label"
        >
          <FigmaIcon :name="isActive(item.to) ? item.iconActive : item.iconDefault" :size="24" />
          <span class="app-top-bar__tooltip">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <RouterLink class="app-top-bar__credit" to="/points" aria-label="积分与购物车">
        <FigmaIcon :name="isActive('/points') ? 'topbar-credit-cart-active' : 'topbar-credit-cart-default'" :size="24" />
      </RouterLink>

      <div
        ref="userMenuRef"
        class="app-top-bar__user"
        @mouseenter="showUserPopover = true"
        @mouseleave="showUserPopover = false"
      >
        <button
          class="app-top-bar__avatar"
          type="button"
          aria-label="用户中心"
          :aria-expanded="showUserPopover"
          @click.stop="showUserPopover = !showUserPopover"
        >
          <FigmaIcon :name="showUserPopover ? 'topbar-user-active' : 'topbar-user-default'" :size="24" />
        </button>

        <UserProfilePopover v-if="showUserPopover" @select="handleUserMenuSelect" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { AppIconName } from '@/components/icons/iconRegistry'
import UserProfilePopover from '@/components/navigation/UserProfilePopover.vue'

interface NavItem {
  label: string
  to: string
  iconDefault: AppIconName
  iconActive: AppIconName
}

type UserMenuKey = 'messages' | 'password' | 'space' | 'team' | 'logout'

const route = useRoute()
const router = useRouter()
const showUserPopover = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const navItems: NavItem[] = [
  { label: '首页', to: '/', iconDefault: 'topbar-home-default', iconActive: 'topbar-home-active' },
  { label: '资源库', to: '/resources', iconDefault: 'topbar-resource-default', iconActive: 'topbar-resource-active' },
  { label: '音色管理', to: '/voices', iconDefault: 'topbar-voice-default', iconActive: 'topbar-voice-active' },
  { label: '团队空间', to: '/team', iconDefault: 'topbar-team-default', iconActive: 'topbar-team-active' },
  { label: '积分管理', to: '/points', iconDefault: 'topbar-points-default', iconActive: 'topbar-points-active' },
  { label: '系统管理', to: '/system', iconDefault: 'topbar-system-default', iconActive: 'topbar-system-active' },
]

const isActive = (to: string): boolean => {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

const handleUserMenuSelect = (key: UserMenuKey): void => {
  showUserPopover.value = false

  if (key === 'space') {
    void router.push('/resources')
    return
  }

  if (key === 'team') {
    void router.push('/team')
  }
}

const handleDocumentClick = (event: MouseEvent): void => {
  if (!showUserPopover.value) {
    return
  }

  const target = event.target as Node | null
  if (target && userMenuRef.value?.contains(target)) {
    return
  }

  showUserPopover.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
