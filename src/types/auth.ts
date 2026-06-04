export type AuthMode = 'password' | 'code' | 'register' | 'reset'
export type ThirdPartyProvider = 'wechat' | 'qq' | 'alipay'

export interface LoginPayload {
  mode: AuthMode
  account: string
  secret: string
}

export interface RegisterPayload {
  username: string
  account: string
  secret: string
}

export interface ResetPasswordPayload {
  username: string
  account: string
  secret: string
}

export interface ThirdPartyLoginPayload {
  provider: ThirdPartyProvider
  firstLogin?: boolean
}

export interface AuthUser {
  id: string
  name: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface ThirdPartyLoginResult {
  needsRegister: boolean
  session?: AuthSession
}
