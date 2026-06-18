export type SystemPanelKey = 'styles' | 'permissions' | 'messages'
export type SystemMessageFilter = 'all' | 'unread' | 'read'
export type SystemPermissionKey = 'resourceLibrary' | 'storyboard' | 'dubbing' | 'systemMessage'

export interface SystemStyleItem {
  id: string
  name: string
  category: string
  prompt: string
  enabled?: boolean
  previewUrl?: string
}

export interface SystemPermissionItem {
  id: string
  role: string
  members: number
  permissions: Record<SystemPermissionKey, boolean>
  updatedAt: string
}

export interface SystemMessageItem {
  id: string
  title: string
  summary: string
  content: string
  status: 'unread' | 'read'
  level: 'high' | 'normal'
  relativeTime: string
  platform: string
  loginMethod: string
  location: string
  loginTime: string
}

export interface SystemState {
  styles: SystemStyleItem[]
  permissions: SystemPermissionItem[]
  messages: SystemMessageItem[]
}
