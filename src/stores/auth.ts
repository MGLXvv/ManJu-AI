import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.api'
import { runtimeConfig } from '@/config/runtimeConfig'
import { applyAuthSession, authSessionBridge, authSessionState } from '@/services/auth/authSessionBridge'
import type {
  AuthSession,
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
  const sessionIssue = authSessionState.sessionIssue
  const loading = ref(false)
  const profileValidated = ref(runtimeConfig.apiMode === 'mock' && Boolean(token.value))

  const isAuthenticated = computed(() => Boolean(token.value))
  const sessionValidated = computed(() => isAuthenticated.value && profileValidated.value)
  const userName = computed(() => user.value?.name ?? '用户')

  const applyVerifiedSession = async (session: AuthSession): Promise<void> => {
    applyAuthSession(session)

    if (runtimeConfig.apiMode !== 'http') {
      profileValidated.value = true
      return
    }

    try {
      const profile = await authApi.getProfile()
      applyAuthSession({ token: session.token, user: profile })
      profileValidated.value = true
    } catch (error) {
      profileValidated.value = false
      authSessionBridge.clear()
      throw error
    }
  }

  const restoreSession = async (): Promise<boolean> => {
    if (!token.value) {
      profileValidated.value = false
      return false
    }

    if (runtimeConfig.apiMode !== 'http') {
      profileValidated.value = true
      return true
    }

    if (profileValidated.value) {
      return true
    }

    try {
      const currentToken = token.value
      const profile = await authApi.getProfile()
      if (!currentToken || token.value !== currentToken) {
        profileValidated.value = false
        return false
      }

      applyAuthSession({ token: currentToken, user: profile })
      profileValidated.value = true
      return true
    } catch (error) {
      profileValidated.value = false
      if (!token.value) {
        return false
      }
      throw error
    }
  }

  const login = async (payload: LoginPayload): Promise<void> => {
    loading.value = true
    try {
      await applyVerifiedSession(await authApi.login(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByPassword = async (payload: PasswordLoginPayload): Promise<void> => {
    loading.value = true
    try {
      await applyVerifiedSession(await authApi.loginByPassword(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByCode = async (payload: CodeLoginPayload): Promise<void> => {
    loading.value = true
    try {
      await applyVerifiedSession(await authApi.loginByCode(payload))
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<void> => {
    loading.value = true
    try {
      await applyVerifiedSession(await authApi.register(payload))
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
        await applyVerifiedSession(result.session)
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
      profileValidated.value = false
      authSessionBridge.clear()
      loading.value = false
    }
  }

  return {
    token,
    user,
    forbidden,
    sessionIssue,
    userName,
    loading,
    isAuthenticated,
    sessionValidated,
    restoreSession,
    consumeSessionIssue: authSessionBridge.consumeSessionIssue,
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
