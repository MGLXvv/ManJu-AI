import { describe, expect, it } from 'vitest'
import { createLatestRequestGuard } from '@/features/shared/latestRequestState'

describe('latestRequestState', () => {
  it('accepts only the latest started request', () => {
    const guard = createLatestRequestGuard()
    const first = guard.start()
    const second = guard.start()

    expect(guard.isCurrent(first)).toBe(false)
    expect(guard.isCurrent(second)).toBe(true)
  })

  it('invalidates an in-flight request without starting another one', () => {
    const guard = createLatestRequestGuard()
    const requestId = guard.start()

    guard.invalidate()

    expect(guard.isCurrent(requestId)).toBe(false)
  })
})
