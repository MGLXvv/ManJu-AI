import { describe, expect, it } from 'vitest'
import { createRouteLoadingTracker, resolveRouteLoadingDelay } from '@/features/navigation/routeLoadingState'

describe('routeLoadingState', () => {
  it('keeps overlapping navigation records isolated', () => {
    const tracker = createRouteLoadingTracker<object>()
    const firstRoute = {}
    const secondRoute = {}

    tracker.register(firstRoute, { token: 1, startedAt: 100 })
    tracker.register(secondRoute, { token: 2, startedAt: 160 })

    expect(tracker.take(firstRoute)).toEqual({ token: 1, startedAt: 100 })
    expect(tracker.take(firstRoute)).toBeUndefined()
    expect(tracker.take(secondRoute)).toEqual({ token: 2, startedAt: 160 })
  })

  it('clamps the minimum loading delay at zero', () => {
    expect(resolveRouteLoadingDelay({ startedAt: 100, now: 250, minimumMs: 420 })).toBe(270)
    expect(resolveRouteLoadingDelay({ startedAt: 100, now: 600, minimumMs: 420 })).toBe(0)
  })
})
