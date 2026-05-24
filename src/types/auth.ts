export type AuthMode = 'password' | 'code' | 'register' | 'reset'

export interface LoginPayload {
  mode: AuthMode
  account: string
  secret: string
}

export interface RegisterPayload {
  account: string
  secret: string
}

export interface AuthUser {
  id: string
  name: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}
