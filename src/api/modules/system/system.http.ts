import { http } from '@/api/http'
import type {
  CreateSystemPermissionInput,
  CreateSystemStyleInput,
  SystemApiContract,
  UpdateSystemPermissionInput,
  UpdateSystemStyleInput,
} from './system.types'

const normalizeSystemState = (value: unknown) => {
  const state = value && typeof value === 'object' && 'state' in value
    ? (value as { state?: unknown }).state
    : value
  const record = state && typeof state === 'object' ? (state as Record<string, unknown>) : {}

  return {
    styles: Array.isArray(record.styles) ? record.styles : [],
    permissions: Array.isArray(record.permissions) ? record.permissions : [],
    messages: Array.isArray(record.messages) ? record.messages : [],
  }
}

export const systemHttpApi: SystemApiContract = {
  async getState() {
    const { data } = await http.get('/system')
    return normalizeSystemState(data)
  },

  async createStyle(input: CreateSystemStyleInput) {
    const { data } = await http.post('/system/styles', input)
    return data.style
  },

  async updateStyle(styleId: string, input: UpdateSystemStyleInput) {
    const { data } = await http.patch(`/system/styles/${styleId}`, input)
    return data.style
  },

  async deleteStyle(styleId: string) {
    await http.delete(`/system/styles/${styleId}`)
  },

  async createPermission(input: CreateSystemPermissionInput) {
    const { data } = await http.post('/system/permissions', input)
    return data.permission
  },

  async updatePermission(permissionId: string, input: UpdateSystemPermissionInput) {
    const { data } = await http.patch(`/system/permissions/${permissionId}`, input)
    return data.permission
  },

  async deletePermission(permissionId: string) {
    await http.delete(`/system/permissions/${permissionId}`)
  },

  async markMessageRead(messageId: string) {
    const { data } = await http.post(`/system/messages/${messageId}/read`)
    return data.message ?? null
  },

  async markAllRead() {
    const { data } = await http.post('/system/messages/read-all')
    return Array.isArray(data.messages) ? data.messages : []
  },

  async clearMessages() {
    await http.delete('/system/messages')
  },
}