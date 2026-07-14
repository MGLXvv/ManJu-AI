import { http } from '@/api/http'
import type {
  CreateSystemPermissionInput,
  CreateSystemStyleInput,
  SystemApiContract,
  SystemMessageItem,
  SystemPermissionItem,
  SystemStyleItem,
  UpdateSystemPermissionInput,
  UpdateSystemStyleInput,
} from './system.types'

const normalizeSystemState = (value: unknown) => {
  const state = value && typeof value === 'object' && 'state' in value ? (value as { state?: unknown }).state : value
  const record = state && typeof state === 'object' ? (state as Record<string, unknown>) : {}

  return {
    styles: Array.isArray(record.styles) ? (record.styles as SystemStyleItem[]) : [],
    permissions: Array.isArray(record.permissions) ? (record.permissions as SystemPermissionItem[]) : [],
    messages: Array.isArray(record.messages) ? (record.messages as SystemMessageItem[]) : [],
  }
}

const asResponseRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const readEntity = <T>(value: unknown, key: string): T | null => {
  const candidate = asResponseRecord(value)[key]
  return candidate !== null && typeof candidate === 'object' && !Array.isArray(candidate) ? (candidate as T) : null
}

export const systemHttpApi: SystemApiContract = {
  async getState() {
    const { data } = await http.get('/system')
    return normalizeSystemState(data)
  },

  async createStyle(input: CreateSystemStyleInput) {
    const { data } = await http.post('/system/styles', input)
    const style = readEntity<SystemStyleItem>(data, 'style')
    if (!style) throw new Error('SYSTEM_STYLE_RESPONSE_INVALID')
    return style
  },

  async updateStyle(styleId: string, input: UpdateSystemStyleInput) {
    const { data } = await http.patch(`/system/styles/${styleId}`, input)
    return readEntity<SystemStyleItem>(data, 'style')
  },

  async deleteStyle(styleId: string) {
    await http.delete(`/system/styles/${styleId}`)
  },

  async createPermission(input: CreateSystemPermissionInput) {
    const { data } = await http.post('/system/permissions', input)
    const permission = readEntity<SystemPermissionItem>(data, 'permission')
    if (!permission) throw new Error('SYSTEM_PERMISSION_RESPONSE_INVALID')
    return permission
  },

  async updatePermission(permissionId: string, input: UpdateSystemPermissionInput) {
    const { data } = await http.patch(`/system/permissions/${permissionId}`, input)
    return readEntity<SystemPermissionItem>(data, 'permission')
  },

  async deletePermission(permissionId: string) {
    await http.delete(`/system/permissions/${permissionId}`)
  },

  async markMessageRead(messageId: string) {
    const { data } = await http.post(`/system/messages/${messageId}/read`)
    return readEntity<SystemMessageItem>(data, 'message')
  },

  async markAllRead() {
    const { data } = await http.post('/system/messages/read-all')
    const messages = asResponseRecord(data).messages
    return Array.isArray(messages) ? (messages as SystemMessageItem[]) : []
  },

  async clearMessages() {
    await http.delete('/system/messages')
  },
}
