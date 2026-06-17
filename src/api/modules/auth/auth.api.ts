import { isMockMode } from '@/api/shared/apiMode'
import { authMockApi } from './auth.mock'
import type { AuthApiContract } from './auth.types'

const resolveAuthApi = async (): Promise<AuthApiContract> => {
  if (isMockMode) {
    return authMockApi
  }

  const { authHttpApi } = await import('./auth.http')
  return authHttpApi
}

export const authApi: AuthApiContract = {
  async login(payload) {
    return (await resolveAuthApi()).login(payload)
  },

  async loginByPassword(payload) {
    return (await resolveAuthApi()).loginByPassword(payload)
  },

  async loginByCode(payload) {
    return (await resolveAuthApi()).loginByCode(payload)
  },

  async register(payload) {
    return (await resolveAuthApi()).register(payload)
  },

  async resetPassword(payload) {
    return (await resolveAuthApi()).resetPassword(payload)
  },

  async requestCode(account) {
    return (await resolveAuthApi()).requestCode(account)
  },

  async loginWithThirdParty(payload) {
    return (await resolveAuthApi()).loginWithThirdParty(payload)
  },

  async logout() {
    return (await resolveAuthApi()).logout()
  },
}

export { AUTH_ERROR, authStorageKeys } from './auth.mock'
