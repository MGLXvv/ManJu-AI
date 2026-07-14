import { isMockMode } from '@/api/shared/apiMode'
import { requireCapability } from '@/features/capabilities/capabilityRegistry'
import { systemHttpApi } from './system.http'
import { systemMockApi } from './system.mock'
import type { SystemApiContract } from './system.types'

const implementation = isMockMode ? systemMockApi : systemHttpApi

/**
 * Phase1 exposes System state as a real read endpoint, while style and permission writes are controlled rejects.
 * Guard writes before the HTTP request so the UI receives one stable frontend capability error.
 */
export const systemApi: SystemApiContract = {
  getState: () => implementation.getState(),
  createStyle: (input) => {
    requireCapability('system.write')
    return implementation.createStyle(input)
  },
  updateStyle: (styleId, input) => {
    requireCapability('system.write')
    return implementation.updateStyle(styleId, input)
  },
  deleteStyle: (styleId) => {
    requireCapability('system.write')
    return implementation.deleteStyle(styleId)
  },
  createPermission: (input) => {
    requireCapability('system.write')
    return implementation.createPermission(input)
  },
  updatePermission: (permissionId, input) => {
    requireCapability('system.write')
    return implementation.updatePermission(permissionId, input)
  },
  deletePermission: (permissionId) => {
    requireCapability('system.write')
    return implementation.deletePermission(permissionId)
  },
  markMessageRead: (messageId) => implementation.markMessageRead(messageId),
  markAllRead: () => implementation.markAllRead(),
  clearMessages: () => implementation.clearMessages(),
}
