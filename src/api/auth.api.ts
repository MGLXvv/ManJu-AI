import { delay, readLocal, removeLocal, writeLocal } from './local'
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
  ThirdPartyProvider,
} from '@/types/auth'

const TOKEN_KEY = 'amd.auth.token'
const USER_KEY = 'amd.auth.user'
const ACCOUNTS_KEY = 'amd.auth.accounts'
const CODES_KEY = 'amd.auth.codes'

interface MockAccountRecord {
  id: string
  username: string
  account: string
  password: string
  boundProviders: ThirdPartyProvider[]
}

interface MockCodeRecord {
  account: string
  code: string
  expiresAt: number
  sentAt: number
}

const AUTH_ERROR = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_NOT_FOUND: 'AUTH_ACCOUNT_NOT_FOUND',
  INVALID_CODE: 'AUTH_INVALID_CODE',
  ACCOUNT_EXISTS: 'AUTH_ACCOUNT_EXISTS',
  ACCOUNT_MISMATCH: 'AUTH_ACCOUNT_MISMATCH',
  CODE_RATE_LIMIT: 'AUTH_CODE_RATE_LIMIT',
} as const

const DEFAULT_ACCOUNTS: MockAccountRecord[] = [
  {
    id: 'user-1',
    username: 'admin11',
    account: 'admin11',
    password: '123456',
    boundProviders: ['wechat'],
  },
]

const buildSession = (user: AuthUser): AuthSession => {
  const token = `mock-token-${Date.now()}`
  writeLocal(TOKEN_KEY, token)
  writeLocal(USER_KEY, user)
  return { token, user }
}

const readAccounts = (): MockAccountRecord[] => {
  const stored = readLocal<MockAccountRecord[] | null>(ACCOUNTS_KEY, null)
  if (stored && stored.length > 0) {
    return stored
  }

  writeLocal(ACCOUNTS_KEY, DEFAULT_ACCOUNTS)
  return DEFAULT_ACCOUNTS
}

const writeAccounts = (accounts: MockAccountRecord[]): void => {
  writeLocal(ACCOUNTS_KEY, accounts)
}

const readCodes = (): MockCodeRecord[] => readLocal<MockCodeRecord[]>(CODES_KEY, [])

const writeCodes = (codes: MockCodeRecord[]): void => {
  writeLocal(CODES_KEY, codes)
}

const issueCode = (account: string): string => {
  const normalizedAccount = account.trim()
  const codes = readCodes()
  const existing = codes.find((item) => item.account === normalizedAccount)
  if (existing && Date.now() - existing.sentAt < 60 * 1000) {
    throw new Error(AUTH_ERROR.CODE_RATE_LIMIT)
  }

  const nextCodes = codes.filter((item) => item.account !== normalizedAccount)
  const code = '123456'
  nextCodes.push({
    account: normalizedAccount,
    code,
    sentAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  writeCodes(nextCodes)
  return code
}

const verifyCode = (account: string, code: string): boolean => {
  const normalizedAccount = account.trim()
  const normalizedCode = code.trim()
  const matched = readCodes().find((item) => item.account === normalizedAccount)
  if (!matched) {
    return normalizedCode === '123456'
  }

  return matched.code === normalizedCode && matched.expiresAt > Date.now()
}

const findAccount = (value: string): MockAccountRecord | undefined => {
  const normalized = value.trim()
  return readAccounts().find((item) => item.account === normalized || item.username === normalized)
}

const findAccountByProvider = (provider: ThirdPartyProvider): MockAccountRecord | undefined => {
  return readAccounts().find((item) => item.boundProviders.includes(provider))
}

const ensureUniqueAccount = (account: string, username: string): void => {
  const accounts = readAccounts()
  const duplicated = accounts.some((item) => item.account === account.trim() || item.username === username.trim())
  if (duplicated) {
    throw new Error(AUTH_ERROR.ACCOUNT_EXISTS)
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    if (payload.mode === 'code') {
      return this.loginByCode({ account: payload.account, code: payload.secret })
    }

    return this.loginByPassword({ account: payload.account, password: payload.secret })
  },

  async loginByPassword(payload: PasswordLoginPayload): Promise<AuthSession> {
    await delay()

    const record = findAccount(payload.account)
    if (!record || record.password !== payload.password.trim()) {
      throw new Error(AUTH_ERROR.INVALID_CREDENTIALS)
    }

    return buildSession({ id: record.id, name: record.username })
  },

  async loginByCode(payload: CodeLoginPayload): Promise<AuthSession> {
    await delay()

    const record = findAccount(payload.account)
    if (!record) {
      throw new Error(AUTH_ERROR.ACCOUNT_NOT_FOUND)
    }

    if (!verifyCode(payload.account, payload.code)) {
      throw new Error(AUTH_ERROR.INVALID_CODE)
    }

    return buildSession({ id: record.id, name: record.username })
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    await delay()

    if (!verifyCode(payload.account, payload.code)) {
      throw new Error(AUTH_ERROR.INVALID_CODE)
    }

    ensureUniqueAccount(payload.account, payload.username)

    const accounts = readAccounts()
    const record: MockAccountRecord = {
      id: `user-${Date.now()}`,
      username: payload.username.trim(),
      account: payload.account.trim(),
      password: payload.password.trim(),
      boundProviders: payload.bindProvider ? [payload.bindProvider] : [],
    }

    accounts.unshift(record)
    writeAccounts(accounts)

    return buildSession({ id: record.id, name: record.username })
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await delay()

    if (!verifyCode(payload.account, payload.code)) {
      throw new Error(AUTH_ERROR.INVALID_CODE)
    }

    const accounts = readAccounts()
    const record = accounts.find((item) => item.account === payload.account.trim() && item.username === payload.username.trim())
    if (!record) {
      throw new Error(AUTH_ERROR.ACCOUNT_MISMATCH)
    }

    record.password = payload.password.trim()
    writeAccounts(accounts)
  },

  async requestCode(account: string): Promise<{ code: string }> {
    await delay(300)
    const code = issueCode(account)
    return { code }
  },

  async loginWithThirdParty(payload: ThirdPartyLoginPayload): Promise<ThirdPartyLoginResult> {
    await delay(500)

    if (payload.firstLogin) {
      return { needsRegister: true }
    }

    const existing = findAccountByProvider(payload.provider)
    if (existing) {
      return {
        needsRegister: false,
        session: buildSession({ id: existing.id, name: existing.username }),
      }
    }

    const providerNameMap = {
      wechat: '微信用户',
      qq: 'QQ用户',
      alipay: '支付宝用户',
    } as const

    const guestUser = {
      id: `user-${payload.provider}-${Date.now()}`,
      name: providerNameMap[payload.provider],
    }

    return {
      needsRegister: false,
      session: buildSession(guestUser),
    }
  },

  async logout(): Promise<void> {
    await delay(80)
    removeLocal(TOKEN_KEY)
    removeLocal(USER_KEY)
  },
}

export { AUTH_ERROR }

export const authStorageKeys = {
  token: TOKEN_KEY,
  user: USER_KEY,
}
