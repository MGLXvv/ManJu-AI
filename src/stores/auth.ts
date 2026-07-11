import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth.api'
import { authSessionRepository } from '@/services/auth/authSessionRepository'
import type {
  AuthSession,
  AuthUser,
  CodeLoginPayload,
  LoginPayload,
  PasswordLoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

const persistedSession = authSessionRepository.load()
const tokenState = ref<string | null>(persistedSession?.token ?? null)
const userState = ref<AuthUser | null>(persistedSession?.user ?? null)
const forbiddenState = ref(false)

const applySession = (session: AuthSession): void => {
  tokenState.value = session.token
  userState.value = session.user
  forbiddenState.value = false
  authSessionRepository.save(session)
}

export const authSessionBridge = {
  getToken: (): string | null => tokenState.value,
  clear: (): void => {
    tokenState.value = null
    userState.value = null
    forbiddenState.value = false
    authSessionRepository.clear()
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
      applySession(await authApi.login(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByPassword = async (payload: PasswordLoginPayload): Promise<void> => {
    loading.value = true
    try {
      applySession(await authApi.loginByPassword(payload))
    } finally {
      loading.value = false
    }
  }

  const loginByCode = async (payload: CodeLoginPayload): Promise<void> => {
    loading.value = true
    try {
      applySession(await authApi.loginByCode(payload))
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<void> => {
    loading.value = true
    try {
      applySession(await authApi.register(payload))
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
        applySession(result.session)
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
