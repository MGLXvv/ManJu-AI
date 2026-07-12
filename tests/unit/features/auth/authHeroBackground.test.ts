import { describe, expect, it, vi } from 'vitest'
import {
  loadAuthHeroBackground,
  pickAuthHeroLoader,
  type AuthHeroLoader,
} from '@/features/auth/authHeroBackground'

const createLoader = (url: string): AuthHeroLoader => vi.fn(async () => ({ default: url }))

describe('auth hero background', () => {
  it('returns null when no background loaders exist', async () => {
    expect(pickAuthHeroLoader([], () => 0.5)).toBeNull()
    await expect(loadAuthHeroBackground([], () => 0.5)).resolves.toBeNull()
  })

  it('selects one loader from a clamped random sample', async () => {
    const first = createLoader('/first.png')
    const second = createLoader('/second.png')

    expect(pickAuthHeroLoader([first, second], () => -1)).toBe(first)
    expect(pickAuthHeroLoader([first, second], () => 2)).toBe(second)
    await expect(loadAuthHeroBackground([first, second], () => 0.75)).resolves.toBe('/second.png')
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('falls back to null when the selected asset fails to load', async () => {
    const failedLoader: AuthHeroLoader = vi.fn(async () => {
      throw new Error('asset unavailable')
    })

    await expect(loadAuthHeroBackground([failedLoader], () => 0)).resolves.toBeNull()
  })

  it('uses the first loader for a non-finite random value', () => {
    const first = createLoader('/first.png')
    const second = createLoader('/second.png')

    expect(pickAuthHeroLoader([first, second], () => Number.NaN)).toBe(first)
  })
})
