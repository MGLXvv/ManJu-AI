<template>
  <RouterView />
  <GlobalLoadingOverlay />
  <GlobalToastStack />
  <GlobalRuntimeErrorPanel />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalLoadingOverlay from '@/components/app/GlobalLoadingOverlay.vue'
import GlobalRuntimeErrorPanel from '@/components/app/GlobalRuntimeErrorPanel.vue'
import GlobalToastStack from '@/components/app/GlobalToastStack.vue'
import { requiresAuth } from '@/router/routeMeta'
import { useAuthStore } from '@/stores/auth'
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const uiFeedback = useUiFeedbackStore()

watch(
  () => auth.isAuthenticated,
  (isAuthenticated, wasAuthenticated) => {
    if (isAuthenticated || !wasAuthenticated || !requiresAuth(route)) return

    const reason = auth.consumeSessionIssue() ?? 'expired'
    void router.replace({
      name: 'login',
      query: {
        redirect: route.fullPath,
        reason,
      },
    })
  },
)

watch(
  () => auth.forbidden,
  (forbidden) => {
    if (!forbidden) return
    const reason = auth.consumeSessionIssue()
    if (reason === 'forbidden') {
      uiFeedback.showToast('当前账号没有执行此操作的权限', { tone: 'error' })
    }
  },
)

watch(
  () => route.query.reason,
  (reason) => {
    if (reason === 'expired') {
      uiFeedback.showToast('登录状态已失效，请重新登录', { tone: 'error' })
    }
    if (reason === 'forbidden') {
      uiFeedback.showToast('当前账号没有访问此页面的权限', { tone: 'error' })
    }
  },
  { immediate: true },
)
</script>
