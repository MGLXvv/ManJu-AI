import type { UserMenuKey } from './appNavigationState'

export interface UserMenuRouteAction {
  type: 'route'
  to: string
}

export interface UserMenuUnavailableAction {
  type: 'unavailable'
  message: string
}

export interface UserMenuLogoutAction {
  type: 'logout'
}

export type UserMenuAction = UserMenuRouteAction | UserMenuUnavailableAction | UserMenuLogoutAction

export function resolveUserMenuAction(key: UserMenuKey): UserMenuAction {
  switch (key) {
    case 'messages':
      return {
        type: 'route',
        to: '/system?panel=messages',
      }
    case 'space':
      return {
        type: 'route',
        to: '/resources',
      }
    case 'password':
      return {
        type: 'unavailable',
        message: '修改密码功能暂未开放',
      }
    case 'logout':
      return {
        type: 'logout',
      }
  }
}
