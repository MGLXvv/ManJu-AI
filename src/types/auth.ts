export type AuthMode = 'password' | 'code' | 'register' | 'reset'
export type ThirdPartyProvider = 'wechat' | 'qq' | 'alipay'

export interface PasswordLoginPayload {
  account: string
  password: string
}

export interface CodeLoginPayload {
  account: string
  code: string
}

export interface RegisterPayload {
  username: string
  account: string
  code: string
  password: string
  bindProvider?: ThirdPartyProvider
}

export interface ResetPasswordPayload {
  username: string
  account: string
  code: string
  password: string
}

export interface LoginPayload {
  mode: AuthMode
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
  username?: string
  nickname?: string
  roles?: string[]
  permissions?: string[]
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface ThirdPartyLoginResult {
  needsRegister: boolean
  session?: AuthSession
}
