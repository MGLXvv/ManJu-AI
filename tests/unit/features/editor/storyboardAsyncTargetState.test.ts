import { describe, expect, it } from 'vitest'
import { shouldApplyStoryboardAsyncResult } from '@/features/editor/storyboardAsyncTargetState'

describe('storyboardAsyncTargetState', () => {
  it('accepts a result for the same project and original shot object', () => {
    const shot = { id: 'shot-1' }

    expect(
      shouldApplyStoryboardAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetShot: shot,
        currentShot: shot,
      }),
    ).toBe(true)
  })

  it('rejects a result after the project changes', () => {
    const shot = { id: 'shot-1' }

    expect(
      shouldApplyStoryboardAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-2',
        targetShot: shot,
        currentShot: shot,
      }),
    ).toBe(false)
  })

  it('rejects a result when the same shot ID now belongs to a replacement object', () => {
    const shot = { id: 'shot-1' }

    expect(
      shouldApplyStoryboardAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        targetShot: shot,
        currentShot: { id: 'shot-1' },
      }),
    ).toBe(false)
  })
})
