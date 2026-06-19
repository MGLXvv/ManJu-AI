import { mockSystemMessages, mockSystemPermissions, mockSystemStyles } from '@/mocks/system.mock'
import { delay, readLocal, writeLocal } from '@/api/local'
import type {
  CreateSystemPermissionInput,
  CreateSystemStyleInput,
  SystemApiContract,
  SystemMessageItem,
  SystemPermissionItem,
  SystemState,
  SystemStyleItem,
  UpdateSystemPermissionInput,
  UpdateSystemStyleInput,
} from './system.types'

const SYSTEM_STATE_KEY = 'amd.system.state'

const nowStamp = (): string => {
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const cloneStyle = (item: SystemStyleItem): SystemStyleItem => ({
  ...item,
  enabled: item.enabled ?? true,
})

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

  const defaultState = getDefaultState()

  return {
    styles: stored.styles?.map(cloneStyle) ?? defaultState.styles,
    permissions: stored.permissions?.map(clonePermission) ?? defaultState.permissions,
    messages: stored.messages?.map(cloneMessage) ?? defaultState.messages,
  }
}

const setSystemState = (state: SystemState): void => writeLocal(SYSTEM_STATE_KEY, state)

export const systemMockApi: SystemApiContract = {
  async getState() {
    await delay()
    const state = getSystemState()
    setSystemState(state)
    return cloneState(state)
  },

  async createStyle(input: CreateSystemStyleInput) {
    await delay(80)
    const state = getSystemState()
    const nextItem: SystemStyleItem = {
      id: `style-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      enabled: input.enabled ?? true,
    }
    state.styles.push(nextItem)
    setSystemState(state)
    return cloneStyle(nextItem)
  },

  async updateStyle(styleId: string, input: UpdateSystemStyleInput) {
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

  async deleteStyle(styleId: string) {
    await delay(80)
    const state = getSystemState()
    state.styles = state.styles.filter((item) => item.id !== styleId)
    setSystemState(state)
  },

  async createPermission(input: CreateSystemPermissionInput) {
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

  async updatePermission(permissionId: string, input: UpdateSystemPermissionInput) {
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

  async deletePermission(permissionId: string) {
    await delay(80)
    const state = getSystemState()
    state.permissions = state.permissions.filter((item) => item.id !== permissionId)
    setSystemState(state)
  },

  async markMessageRead(messageId: string) {
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

  async markAllRead() {
    await delay(80)
    const state = getSystemState()
    state.messages = state.messages.map((item) => ({ ...item, status: 'read' }))
    setSystemState(state)
    return state.messages.map(cloneMessage)
  },

  async clearMessages() {
    await delay(80)
    const state = getSystemState()
    state.messages = []
    setSystemState(state)
  },
}
