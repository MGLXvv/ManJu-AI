import { describe, expect, it } from 'vitest'
import { resolveUserMenuAction } from '@/features/navigation/appUserMenuActionState'

describe('appUserMenuActionState', () => {
  it('routes messages to the system message panel', () => {
    expect(resolveUserMenuAction('messages')).toEqual({
      type: 'route',
      to: '/system?panel=messages',
    })
  })

  it('routes personal space to resources', () => {
    expect(resolveUserMenuAction('space')).toEqual({
      type: 'route',
      to: '/resources',
    })
  })

  it('marks password as unavailable', () => {
    expect(resolveUserMenuAction('password')).toEqual({
      type: 'unavailable',
      message: '修改密码功能暂未开放',
    })
  })

  it('returns logout action for logout', () => {
    expect(resolveUserMenuAction('logout')).toEqual({
      type: 'logout',
    })
  })
})
