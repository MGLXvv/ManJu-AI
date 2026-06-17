import type {
  AuthSession,
  CodeLoginPayload,
  LoginPayload,
  PasswordLoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

export type {
  AuthSession,
  CodeLoginPayload,
  LoginPayload,
  PasswordLoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ThirdPartyLoginPayload,
  ThirdPartyLoginResult,
} from '@/types/auth'

export interface AuthApiContract {
  login(payload: LoginPayload): Promise<AuthSession>
  loginByPassword(payload: PasswordLoginPayload): Promise<AuthSession>
  loginByCode(payload: CodeLoginPayload): Promise<AuthSession>
  register(payload: RegisterPayload): Promise<AuthSession>
  resetPassword(payload: ResetPasswordPayload): Promise<void>
  requestCode(account: string): Promise<{ code: string }>
  loginWithThirdParty(payload: ThirdPartyLoginPayload): Promise<ThirdPartyLoginResult>
  logout(): Promise<void>
}
