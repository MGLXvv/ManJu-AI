import { ref } from 'vue'
import { authSessionRepository } from './authSessionRepository'
import type { AuthSession, AuthUser } from '@/types/auth'

export type AuthSessionIssue = 'expired' | 'forbidden' | null

const persistedSession = authSessionRepository.load()

export const authSessionState = {
  token: ref<string | null>(persistedSession?.token ?? null),
  user: ref<AuthUser | null>(persistedSession?.user ?? null),
  forbidden: ref(false),
  sessionIssue: ref<AuthSessionIssue>(null),
}

const clearSessionData = (): void => {
  authSessionState.token.value = null
  authSessionState.user.value = null
  authSessionState.forbidden.value = false
  authSessionRepository.clear()
}

export const applyAuthSession = (session: AuthSession): void => {
  authSessionState.token.value = session.token
  authSessionState.user.value = session.user
  authSessionState.forbidden.value = false
  authSessionState.sessionIssue.value = null
  authSessionRepository.save(session)
}

export const authSessionBridge = {
  getToken: (): string | null => authSessionState.token.value,
  clear: (): void => {
    clearSessionData()
    authSessionState.sessionIssue.value = null
  },
  expire: (): void => {
    clearSessionData()
    authSessionState.sessionIssue.value = 'expired'
  },
  markForbidden: (): void => {
    authSessionState.forbidden.value = true
    authSessionState.sessionIssue.value = 'forbidden'
  },
  consumeSessionIssue: (): AuthSessionIssue => {
    const issue = authSessionState.sessionIssue.value
    authSessionState.sessionIssue.value = null
    if (issue === 'forbidden') authSessionState.forbidden.value = false
    return issue
  },
}
