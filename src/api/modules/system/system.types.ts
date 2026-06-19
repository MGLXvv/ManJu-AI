import type {
  SystemMessageItem,
  SystemPermissionItem,
  SystemState,
  SystemStyleItem,
} from '@/types/system'

export type {
  SystemMessageItem,
  SystemPermissionItem,
  SystemState,
  SystemStyleItem,
} from '@/types/system'

export type CreateSystemStyleInput = Omit<SystemStyleItem, 'id'>
export type UpdateSystemStyleInput = Partial<SystemStyleItem>

export type CreateSystemPermissionInput = Omit<SystemPermissionItem, 'id' | 'updatedAt'>
export type UpdateSystemPermissionInput = Omit<Partial<SystemPermissionItem>, 'permissions'> & {
  permissions?: Partial<SystemPermissionItem['permissions']>
}

export interface SystemApiContract {
  getState(): Promise<SystemState>

  createStyle(input: CreateSystemStyleInput): Promise<SystemStyleItem>
  updateStyle(styleId: string, input: UpdateSystemStyleInput): Promise<SystemStyleItem | null>
  deleteStyle(styleId: string): Promise<void>

  createPermission(input: CreateSystemPermissionInput): Promise<SystemPermissionItem>
  updatePermission(permissionId: string, input: UpdateSystemPermissionInput): Promise<SystemPermissionItem | null>
  deletePermission(permissionId: string): Promise<void>

  markMessageRead(messageId: string): Promise<SystemMessageItem | null>
  markAllRead(): Promise<SystemMessageItem[]>
  clearMessages(): Promise<void>
}
