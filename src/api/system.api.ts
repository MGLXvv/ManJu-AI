import { mockSystemMessages, mockSystemPermissions, mockSystemStyles } from '@/mocks/system.mock'
import type {
  SystemMessageItem,
  SystemPermissionItem,
  SystemState,
  SystemStyleItem,
} from '@/types/system'
import { delay, readLocal, writeLocal } from './local'

const SYSTEM_STATE_KEY = 'amd.system.state'

const nowStamp = (): string => {
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const cloneStyle = (item: SystemStyleItem): SystemStyleItem => ({ ...item })
const clonePermission = (item: SystemPermissionItem): SystemPermissionItem => ({
  ...item,
  permissions: { ...item.permissions },
})
const cloneMessage = (item: SystemMessageItem): SystemMessageItem => ({ ...item })

const getDefaultState = (): SystemState => ({
  styles: mockSystemStyles.map(cloneStyle),
  permissions: mockSystemPermissions.map(clonePermission),
  messages: mockSystemMessages.map(cloneMessage),
})

const cloneState = (state: SystemState): SystemState => ({
  styles: state.styles.map(cloneStyle),
  permissions: state.permissions.map(clonePermission),
  messages: state.messages.map(cloneMessage),
})

const getSystemState = (): SystemState => {
  const stored = readLocal<SystemState | null>(SYSTEM_STATE_KEY, null)
  if (!stored) {
    return getDefaultState()
  }

  return {
    styles: stored.styles?.map(cloneStyle) ?? getDefaultState().styles,
    permissions: stored.permissions?.map(clonePermission) ?? getDefaultState().permissions,
    messages: stored.messages?.map(cloneMessage) ?? getDefaultState().messages,
  }
}

const setSystemState = (state: SystemState): void => writeLocal(SYSTEM_STATE_KEY, state)

export const systemApi = {
  async getState(): Promise<SystemState> {
    await delay()
    const state = getSystemState()
    setSystemState(state)
    return cloneState(state)
  },

  async createStyle(input: Omit<SystemStyleItem, 'id'>): Promise<SystemStyleItem> {
    await delay(80)
    const state = getSystemState()
    const nextItem: SystemStyleItem = {
      id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
    }
    state.styles.push(nextItem)
    setSystemState(state)
    return cloneStyle(nextItem)
  },

  async updateStyle(styleId: string, input: Partial<SystemStyleItem>): Promise<SystemStyleItem | null> {
    await delay(80)
    const state = getSystemState()
    const targetIndex = state.styles.findIndex((item) => item.id === styleId)
    if (targetIndex < 0) {
      return null
    }
    const nextItem: SystemStyleItem = {
      ...state.styles[targetIndex],
      ...input,
    }
    state.styles.splice(targetIndex, 1, nextItem)
    setSystemState(state)
    return cloneStyle(nextItem)
  },

  async deleteStyle(styleId: string): Promise<void> {
    await delay(80)
    const state = getSystemState()
    state.styles = state.styles.filter((item) => item.id !== styleId)
    setSystemState(state)
  },

  async createPermission(input: Omit<SystemPermissionItem, 'id' | 'updatedAt'>): Promise<SystemPermissionItem> {
    await delay(80)
    const state = getSystemState()
    const nextItem: SystemPermissionItem = {
      id: `perm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      updatedAt: nowStamp(),
    }
    state.permissions.push(nextItem)
    setSystemState(state)
    return clonePermission(nextItem)
  },

  async updatePermission(permissionId: string, input: Partial<SystemPermissionItem>): Promise<SystemPermissionItem | null> {
    await delay(80)
    const state = getSystemState()
    const targetIndex = state.permissions.findIndex((item) => item.id === permissionId)
    if (targetIndex < 0) {
      return null
    }
    const nextItem: SystemPermissionItem = {
      ...state.permissions[targetIndex],
      ...input,
      permissions: {
        ...state.permissions[targetIndex].permissions,
        ...input.permissions,
      },
      updatedAt: nowStamp(),
    }
    state.permissions.splice(targetIndex, 1, nextItem)
    setSystemState(state)
    return clonePermission(nextItem)
  },

  async deletePermission(permissionId: string): Promise<void> {
    await delay(80)
    const state = getSystemState()
    state.permissions = state.permissions.filter((item) => item.id !== permissionId)
    setSystemState(state)
  },

  async markMessageRead(messageId: string): Promise<SystemMessageItem | null> {
    await delay(60)
    const state = getSystemState()
    const targetIndex = state.messages.findIndex((item) => item.id === messageId)
    if (targetIndex < 0) {
      return null
    }
    const nextItem: SystemMessageItem = {
      ...state.messages[targetIndex],
      status: 'read',
    }
    state.messages.splice(targetIndex, 1, nextItem)
    setSystemState(state)
    return cloneMessage(nextItem)
  },

  async markAllRead(): Promise<SystemMessageItem[]> {
    await delay(80)
    const state = getSystemState()
    state.messages = state.messages.map((item) => ({ ...item, status: 'read' }))
    setSystemState(state)
    return state.messages.map(cloneMessage)
  },

  async clearMessages(): Promise<void> {
    await delay(80)
    const state = getSystemState()
    state.messages = []
    setSystemState(state)
  },
}
