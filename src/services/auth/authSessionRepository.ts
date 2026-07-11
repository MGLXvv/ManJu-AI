import { readLocal, removeLocal, writeLocal } from '@/api/local'
import { AUTH_STORAGE_KEYS } from '@/api/modules/auth/auth.constants'
import type { AuthSession, AuthUser } from '@/types/auth'

const readSession = (): AuthSession | null => {
  const token = readLocal<string | null>(AUTH_STORAGE_KEYS.token, null)
  const user = readLocal<AuthUser | null>(AUTH_STORAGE_KEYS.user, null)

  if (!token || !user?.id) {
    return null
  }

  return { token, user }
}

export const authSessionRepository = {
  load(): AuthSession | null {
    return readSession()
  },

  save(session: AuthSession): void {
    writeLocal(AUTH_STORAGE_KEYS.token, session.token)
    writeLocal(AUTH_STORAGE_KEYS.user, session.user)
  },

  clear(): void {
    removeLocal(AUTH_STORAGE_KEYS.token)
    removeLocal(AUTH_STORAGE_KEYS.user)
  },
}
