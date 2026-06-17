import axios from 'axios'
import { authSessionBridge } from '@/stores/auth'
import { attachInterceptors } from './interceptors'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

attachInterceptors(http, {
  getToken: () => authSessionBridge.getToken(),
  onUnauthorized: () => authSessionBridge.clear(),
  onForbidden: () => authSessionBridge.markForbidden(),
})
