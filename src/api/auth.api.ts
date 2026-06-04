import { delay, removeLocal, writeLocal } from './local'
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

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

  async register(payload: RegisterPayload): Promise<AuthSession> {
    await delay()

    const token = `mock-token-${Date.now()}`
    const user = {
      id: `user-${Date.now()}`,
      name: payload.username || payload.account || '新用户',
    }

    writeLocal(TOKEN_KEY, token)
    writeLocal(USER_KEY, user)
    return { token, user }
  },

  async resetPassword(_: ResetPasswordPayload): Promise<void> {
    await delay()
  },

  async requestCode(_: string): Promise<void> {
    await delay(300)
  },

  async loginWithThirdParty(payload: ThirdPartyLoginPayload): Promise<ThirdPartyLoginResult> {
    await delay(500)

    if (payload.firstLogin) {
      return { needsRegister: true }
    }

    const providerNameMap = {
      wechat: '微信用户',
      qq: 'QQ用户',
      alipay: '支付宝用户',
    } as const

    const token = `mock-token-${Date.now()}`
    const user = {
      id: `user-${payload.provider}-${Date.now()}`,
      name: providerNameMap[payload.provider],
    }

    writeLocal(TOKEN_KEY, token)
    writeLocal(USER_KEY, user)
    return {
      needsRegister: false,
      session: { token, user },
    }
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
