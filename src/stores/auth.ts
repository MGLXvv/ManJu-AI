import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.api'
import { applyAuthSession, authSessionBridge, authSessionState } from '@/services/auth/authSessionBridge'
import type {
  CodeLoginPayload,
  LoginPayload,
  PasswordLoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

export { authSessionBridge }

export const useAuthStore = defineStore('auth', () => {
  const token = authSessionState.token
  const user = authSessionState.user
  const forbidden = authSessionState.forbidden
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.name ?? '用户')

  const login = async (payload: LoginPayload): Promise<void> => {
    loading.value = true
    try {
      applyAuthSession(await authApi.login(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByPassword = async (payload: PasswordLoginPayload): Promise<void> => {
    loading.value = true
    try {
      applyAuthSession(await authApi.loginByPassword(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByCode = async (payload: CodeLoginPayload): Promise<void> => {
    loading.value = true
    try {
      applyAuthSession(await authApi.loginByCode(payload))
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<void> => {
    loading.value = true
    try {
      applyAuthSession(await authApi.register(payload))
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
    loading.value = true
    try {
      await authApi.resetPassword(payload)
    } finally {
      loading.value = false
    }
  }

  const requestCode = async (account: string): Promise<{ code: string }> => {
    loading.value = true
    try {
      return await authApi.requestCode(account)
    } finally {
      loading.value = false
    }
  }

  const loginWithThirdParty = async (payload: ThirdPartyLoginPayload): Promise<ThirdPartyLoginResult> => {
    loading.value = true
    try {
      const result = await authApi.loginWithThirdParty(payload)
      if (result.session) {
        applyAuthSession(result.session)
      }
      return result
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    loading.value = true
    try {
      await authApi.logout()
    } finally {
      authSessionBridge.clear()
      loading.value = false
    }
  }

  return {
    token,
    user,
    forbidden,
    userName,
    loading,
    isAuthenticated,
    login,
    loginByPassword,
    loginByCode,
    register,
    resetPassword,
    requestCode,
    loginWithThirdParty,
    logout,
  }
})
