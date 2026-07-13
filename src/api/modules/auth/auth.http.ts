import { http } from '@/api/http'
import type { AuthApiContract, AuthUser } from './auth.types'

interface BackendLoginData {
  userId: number | string
  username: string
  accessToken: string
  refreshToken?: string
  tokenType?: string
}

interface BackendProfileData {
  userId: number | string
  username: string
  nickname?: string | null
  roles?: string[] | null
  permissions?: string[] | null
}

const mapBackendLoginToSession = (data: BackendLoginData) => ({
  token: data.accessToken,
  user: {
    id: String(data.userId),
    name: data.username,
    username: data.username,
  },
})

const mapBackendProfileToUser = (data: BackendProfileData): AuthUser => ({
  id: String(data.userId),
  name: data.nickname?.trim() || data.username,
  username: data.username,
  nickname: data.nickname?.trim() || undefined,
  roles: Array.isArray(data.roles) ? [...data.roles] : [],
  permissions: Array.isArray(data.permissions) ? [...data.permissions] : [],
})

export const authHttpApi: AuthApiContract = {
  async login(payload) {
    const { data } = await http.post<BackendLoginData>('/system/auth/login', {
      username: payload.account,
      password: payload.secret,
    })

    return mapBackendLoginToSession(data)
  },

  async loginByPassword(payload) {
    const { data } = await http.post<BackendLoginData>('/system/auth/login', {
      username: payload.account,
      password: payload.password,
    })

    return mapBackendLoginToSession(data)
  },

  async loginByCode() {
    throw new Error('AUTH_HTTP_CODE_LOGIN_UNSUPPORTED')
  },

  async register() {
    throw new Error('AUTH_HTTP_REGISTER_UNSUPPORTED')
  },

  async resetPassword() {
    throw new Error('AUTH_HTTP_RESET_PASSWORD_UNSUPPORTED')
  },

  async requestCode() {
    throw new Error('AUTH_HTTP_REQUEST_CODE_UNSUPPORTED')
  },

  async loginWithThirdParty() {
    throw new Error('AUTH_HTTP_THIRD_PARTY_LOGIN_UNSUPPORTED')
  },

  async getProfile() {
    const { data } = await http.get<BackendProfileData>('/system/auth/profile')
    return mapBackendProfileToUser(data)
  },

  async logout() {
    // The backend integration pack does not define a logout endpoint.
  },
}
