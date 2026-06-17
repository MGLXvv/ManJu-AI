import { http } from '@/api/http'
import type { AuthApiContract } from './auth.types'

export const authHttpApi: AuthApiContract = {
  async login(payload) {
    const { data } = await http.post('/auth/login', payload)
    return data.session
  },

  async loginByPassword(payload) {
    const { data } = await http.post('/auth/login/password', payload)
    return data.session
  },

  async loginByCode(payload) {
    const { data } = await http.post('/auth/login/code', payload)
    return data.session
  },

  async register(payload) {
    const { data } = await http.post('/auth/register', payload)
    return data.session
  },

  async resetPassword(payload) {
    await http.post('/auth/password/reset', payload)
  },

  async requestCode(account) {
    const { data } = await http.post('/auth/code', { account })
    return data
  },

  async loginWithThirdParty(payload) {
    const { data } = await http.post('/auth/login/third-party', payload)
    return data
  },

  async logout() {
    await http.post('/auth/logout')
  },
}
