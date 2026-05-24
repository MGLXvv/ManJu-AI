import { delay, removeLocal, writeLocal } from './local'
import type { AuthSession, LoginPayload } from '@/types/auth'

const TOKEN_KEY = 'amd.auth.token'
const USER_KEY = 'amd.auth.user'

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    await delay()

    const token = `mock-token-${Date.now()}`
    const user = {
      id: 'user-1',
      name: payload.account || '用户',
    }

    writeLocal(TOKEN_KEY, token)
    writeLocal(USER_KEY, user)
    return { token, user }
  },

  async logout(): Promise<void> {
    await delay(80)
    removeLocal(TOKEN_KEY)
    removeLocal(USER_KEY)
  },
}

export const authStorageKeys = {
  token: TOKEN_KEY,
  user: USER_KEY,
}
