import { delay, readLocal, writeLocal } from '@/api/local'
import type { AuthSession, AuthUser, ThirdPartyProvider } from '@/types/auth'
import { AUTH_ERROR } from './auth.constants'
import type { AuthApiContract } from './auth.types'

const ACCOUNTS_KEY = 'amd.auth.accounts'
const CODES_KEY = 'amd.auth.codes'

interface MockAccountRecord {
  id: string
  username: string
  account: string
  passwordVerifier: string
  boundProviders: ThirdPartyProvider[]
}

interface LegacyMockAccountRecord extends Partial<MockAccountRecord> {
  password?: string
}

interface MockCodeRecord {
  account: string
  code: string
  expiresAt: number
  sentAt: number
}

// This verifier only prevents plaintext storage in the front-end mock database.
// Real password hashing and verification must remain a backend responsibility.
const createMockPasswordVerifier = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `mock-v1-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

const DEFAULT_ACCOUNTS: MockAccountRecord[] = [
  {
    id: 'user-1',
    username: 'admin11',
    account: 'admin11',
    passwordVerifier: createMockPasswordVerifier('123456'),
    boundProviders: ['wechat'],
  },
]

const buildSession = (user: AuthUser): AuthSession => ({
  token: `mock-token-${Date.now()}`,
  user,
})

const normalizeStoredAccount = (value: LegacyMockAccountRecord): MockAccountRecord | null => {
  if (!value.id || !value.username || !value.account) {
    return null
  }

  const passwordVerifier =
    typeof value.passwordVerifier === 'string' && value.passwordVerifier
      ? value.passwordVerifier
      : typeof value.password === 'string'
        ? createMockPasswordVerifier(value.password)
        : ''

  if (!passwordVerifier) {
    return null
  }

  return {
    id: value.id,
    username: value.username,
    account: value.account,
    passwordVerifier,
    boundProviders: Array.isArray(value.boundProviders) ? value.boundProviders : [],
  }
}

const writeAccounts = (accounts: MockAccountRecord[]): void => {
  writeLocal(ACCOUNTS_KEY, accounts)
}

const readAccounts = (): MockAccountRecord[] => {
  const stored = readLocal<LegacyMockAccountRecord[] | null>(ACCOUNTS_KEY, null)
  if (stored && stored.length > 0) {
    const normalized = stored
      .map(normalizeStoredAccount)
      .filter((item): item is MockAccountRecord => item !== null)

    if (normalized.length > 0) {
      writeAccounts(normalized)
      return normalized
    }
  }

  const defaults = DEFAULT_ACCOUNTS.map((item) => ({
    ...item,
    boundProviders: [...item.boundProviders],
  }))
  writeAccounts(defaults)
  return defaults
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

const findAccountByProvider = (provider: ThirdPartyProvider): MockAccountRecord | undefined =>
  readAccounts().find((item) => item.boundProviders.includes(provider))

const ensureUniqueAccount = (account: string, username: string): void => {
  const accounts = readAccounts()
  const duplicated = accounts.some((item) => item.account === account.trim() || item.username === username.trim())
  if (duplicated) {
    throw new Error(AUTH_ERROR.ACCOUNT_EXISTS)
  }
}

export const authMockApi: AuthApiContract = {
  async login(payload) {
    if (payload.mode === 'code') {
      return this.loginByCode({ account: payload.account, code: payload.secret })
    }

    return this.loginByPassword({ account: payload.account, password: payload.secret })
  },

  async loginByPassword(payload) {
    await delay()

    const record = findAccount(payload.account)
    if (!record || record.passwordVerifier !== createMockPasswordVerifier(payload.password.trim())) {
      throw new Error(AUTH_ERROR.INVALID_CREDENTIALS)
    }

    return buildSession({ id: record.id, name: record.username })
  },

  async loginByCode(payload) {
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

  async register(payload) {
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
      passwordVerifier: createMockPasswordVerifier(payload.password.trim()),
      boundProviders: payload.bindProvider ? [payload.bindProvider] : [],
    }

    accounts.unshift(record)
    writeAccounts(accounts)

    return buildSession({ id: record.id, name: record.username })
  },

  async resetPassword(payload) {
    await delay()

    if (!verifyCode(payload.account, payload.code)) {
      throw new Error(AUTH_ERROR.INVALID_CODE)
    }

    const accounts = readAccounts()
    const record = accounts.find((item) => item.account === payload.account.trim() && item.username === payload.username.trim())
    if (!record) {
      throw new Error(AUTH_ERROR.ACCOUNT_MISMATCH)
    }

    record.passwordVerifier = createMockPasswordVerifier(payload.password.trim())
    writeAccounts(accounts)
  },

  async requestCode(account) {
    await delay(300)
    const code = issueCode(account)
    return { code }
  },

  async loginWithThirdParty(payload) {
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

    return {
      needsRegister: false,
      session: buildSession({
        id: `user-${payload.provider}-${Date.now()}`,
        name: providerNameMap[payload.provider],
      }),
    }
  },

  async logout() {
    await delay(80)
  },
}
