import { ref } from 'vue'
import { authSessionRepository } from './authSessionRepository'
import type { AuthSession, AuthUser } from '@/types/auth'

const persistedSession = authSessionRepository.load()

export const authSessionState = {
  token: ref<string | null>(persistedSession?.token ?? null),
  user: ref<AuthUser | null>(persistedSession?.user ?? null),
  forbidden: ref(false),
}

export const applyAuthSession = (session: AuthSession): void => {
  authSessionState.token.value = session.token
  authSessionState.user.value = session.user
  authSessionState.forbidden.value = false
  authSessionRepository.save(session)
}

export const authSessionBridge = {
  getToken: (): string | null => authSessionState.token.value,
  clear: (): void => {
    authSessionState.token.value = null
    authSessionState.user.value = null
    authSessionState.forbidden.value = false
    authSessionRepository.clear()
  },
  markForbidden: (): void => {
    authSessionState.forbidden.value = true
  },
}
