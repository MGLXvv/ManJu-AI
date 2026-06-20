import { describe, expect, it } from 'vitest'
import { buildAppTopNavItems, buildUserMenuItems } from '@/features/navigation/appNavigationState'

describe('appNavigationState', () => {
  it('keeps only the confirmed top navigation entries', () => {
    expect(buildAppTopNavItems().map((item) => item.to)).toEqual([
      '/',
      '/resources',
      '/voices',
      '/system',
    ])
  })

  it('removes team switching from the user menu', () => {
    expect(buildUserMenuItems().map((item) => item.key)).toEqual([
      'messages',
      'password',
      'space',
      'logout',
    ])
  })

  it('does not expose unconfirmed top navigation items', () => {
    const labels = buildAppTopNavItems().map((item) => item.label)

    expect(labels).not.toContain('团队空间')
    expect(labels).not.toContain('积分商城')
    expect(labels).not.toContain('充值')
  })
})
