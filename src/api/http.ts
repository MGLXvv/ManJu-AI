import axios from 'axios'
import { runtimeConfig } from '@/config/runtimeConfig'
import { authSessionBridge } from '@/services/auth/authSessionBridge'
import { attachInterceptors } from './interceptors'

export const http = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 30000,
})

attachInterceptors(http, {
  getToken: () => authSessionBridge.getToken(),
  onUnauthorized: () => authSessionBridge.clear(),
  onForbidden: () => authSessionBridge.markForbidden(),
})
