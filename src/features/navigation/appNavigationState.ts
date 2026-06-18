import type { AppIconName } from '@/components/icons/iconRegistry'

export interface AppTopNavItem {
  label: string
  to: string
  iconDefault: AppIconName
}

export type UserMenuKey = 'messages' | 'password' | 'space' | 'logout'

export interface UserMenuItem {
  key: UserMenuKey
  label: string
  icon: AppIconName
}

export const buildAppTopNavItems = (): AppTopNavItem[] => [
  { label: '首页', to: '/', iconDefault: 'topbar-home-default' },
  { label: '资源库', to: '/resources', iconDefault: 'topbar-resource-default' },
  { label: '音色管理', to: '/voices', iconDefault: 'topbar-voice-default' },
  { label: '系统管理', to: '/system', iconDefault: 'topbar-system-default' },
]

export const buildUserMenuItems = (): UserMenuItem[] => [
  { key: 'messages', label: '消息通知 (6)', icon: 'user-menu-notify' },
  { key: 'password', label: '修改密码', icon: 'user-menu-password' },
  { key: 'space', label: '资源库个人空间', icon: 'user-menu-space' },
  { key: 'logout', label: '退出登录', icon: 'user-menu-logout' },
]
