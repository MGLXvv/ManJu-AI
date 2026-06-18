import { describe, expect, it } from 'vitest'
import { buildAppTopNavItems, buildUserMenuItems } from './appNavigationState'

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
})
