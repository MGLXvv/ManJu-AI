import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, authStorageKeys } from '@/api/auth.api'
import { readLocal, removeLocal } from '@/api/local'
import type {
  AuthUser,
  CodeLoginPayload,
  LoginPayload,
  PasswordLoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

const tokenState = ref<string | null>(readLocal<string | null>(authStorageKeys.token, null))
const userState = ref<AuthUser | null>(readLocal<AuthUser | null>(authStorageKeys.user, null))
const forbiddenState = ref(false)

export const authSessionBridge = {
  getToken: (): string | null => tokenState.value,
  clear: (): void => {
    tokenState.value = null
    userState.value = null
    forbiddenState.value = false
    removeLocal(authStorageKeys.token)
    removeLocal(authStorageKeys.user)
  },
  markForbidden: (): void => {
    forbiddenState.value = true
  },
}

export const useAuthStore = defineStore('auth', () => {
  const token = tokenState
  const user = userState
  const forbidden = forbiddenState
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.name ?? '用户')

  const login = async (payload: LoginPayload): Promise<void> => {
    loading.value = true
    try {
      const session = await authApi.login(payload)
      token.value = session.token
      user.value = session.user
      forbidden.value = false
    } finally {
      loading.value = false
    }
  }

  const loginByPassword = async (payload: PasswordLoginPayload): Promise<void> => {
    loading.value = true
    try {
      const session = await authApi.loginByPassword(payload)
      token.value = session.token
      user.value = session.user
      forbidden.value = false
    } finally {
      loading.value = false
    }
  }

  const loginByCode = async (payload: CodeLoginPayload): Promise<void> => {
    loading.value = true
    try {
      const session = await authApi.loginByCode(payload)
      token.value = session.token
      user.value = session.user
      forbidden.value = false
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<void> => {
    loading.value = true
    try {
      const session = await authApi.register(payload)
      token.value = session.token
      user.value = session.user
      forbidden.value = false
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
        token.value = result.session.token
        user.value = result.session.user
        forbidden.value = false
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
      authSessionBridge.clear()
    } finally {
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
