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
        </RouterLink>
      </nav>

      <RouterLink class="app-top-bar__credit" to="/points" aria-label="积分">
        <FigmaIcon class="app-top-bar__credit-icon" name="nav-points-active" :size="20" />
        <span class="app-top-bar__credit-value">0</span>
        <span class="app-top-bar__credit-sep" aria-hidden="true"></span>
        <span class="app-top-bar__credit-plus" aria-hidden="true">+</span>
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
          <CircleUserRound :size="22" aria-hidden="true" />
        </button>

        <UserProfilePopover v-if="showUserPopover" @select="handleUserMenuSelect" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CircleUserRound } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'
import UserProfilePopover from '@/components/navigation/UserProfilePopover.vue'

interface NavItem {
  label: string
  to: string
  iconDefault: FigmaIconName
  iconActive: FigmaIconName
}

type UserMenuKey = 'messages' | 'password' | 'space' | 'team' | 'logout'

const route = useRoute()
const router = useRouter()
const showUserPopover = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const navItems: NavItem[] = [
  { label: '首页', to: '/', iconDefault: 'nav-home-default', iconActive: 'nav-home-active' },
  { label: '资源库', to: '/resources', iconDefault: 'nav-resource-default', iconActive: 'nav-resource-active' },
  { label: '音色管理', to: '/voices', iconDefault: 'nav-voice-default', iconActive: 'nav-voice-active' },
  { label: '团队空间', to: '/team', iconDefault: 'nav-team-default', iconActive: 'nav-team-active' },
  { label: '积分管理', to: '/points', iconDefault: 'nav-points-default', iconActive: 'nav-points-active' },
  { label: '系统管理', to: '/system', iconDefault: 'nav-system-default', iconActive: 'nav-system-active' },
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
