import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, authStorageKeys } from '@/api/auth.api'
import { readLocal } from '@/api/local'
import type { AuthUser, LoginPayload } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readLocal<string | null>(authStorageKeys.token, null))
  const user = ref<AuthUser | null>(readLocal<AuthUser | null>(authStorageKeys.user, null))
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.name ?? '用户')

  const login = async (payload: LoginPayload): Promise<void> => {
    loading.value = true
    try {
      const session = await authApi.login(payload)
      token.value = session.token
      user.value = session.user
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    loading.value = true
    try {
      await authApi.logout()
      token.value = null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return { token, user, userName, loading, isAuthenticated, login, logout }
})
