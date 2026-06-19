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
          <FigmaIcon :name="item.iconDefault" :size="24" />
          <span class="app-top-bar__tooltip">{{ item.label }}</span>
        </RouterLink>
      </nav>

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
          <FigmaIcon name="topbar-user-default" :size="24" />
        </button>

        <UserProfilePopover v-if="showUserPopover" :active-key="activeUserMenuKey" @select="handleUserMenuSelect" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import UserProfilePopover from '@/components/navigation/UserProfilePopover.vue'
import { buildAppTopNavItems, type UserMenuKey } from '@/features/navigation/appNavigationState'
import { resolveUserMenuAction } from '@/features/navigation/appUserMenuActionState'
import { useAuthStore } from '@/stores/auth'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiFeedback = useUiFeedbackStore()
const showUserPopover = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const navItems = buildAppTopNavItems()

const activeUserMenuKey = computed<UserMenuKey | null>(() => {
  if (route.path.startsWith('/system')) {
    return 'messages'
  }

  if (route.path.startsWith('/resources')) {
    return 'space'
  }

  return null
})

const isActive = (to: string): boolean => {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

const handleUserMenuSelect = async (key: UserMenuKey): Promise<void> => {
  showUserPopover.value = false

  const action = resolveUserMenuAction(key)

  if (action.type === 'route') {
    await router.push(action.to)
    return
  }

  if (action.type === 'unavailable') {
    uiFeedback.showToast(action.message, { tone: 'info' })
    return
  }

  await authStore.logout()
  await router.push({ name: 'login' })
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
