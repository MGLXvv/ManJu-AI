import { describe, expect, it } from 'vitest'
import { shouldApplyVideoTextOptimizationResult } from '@/features/editor/videoTextOptimizationState'

describe('videoTextOptimizationState', () => {
  it('accepts a result when project, shot, and source value are unchanged', () => {
    expect(
      shouldApplyVideoTextOptimizationResult({
        target: { projectId: 'project-1', shotId: 'shot-1', value: 'original' },
        currentProjectId: 'project-1',
        currentShotId: 'shot-1',
        currentValue: 'original',
      }),
    ).toBe(true)
  })

  it('rejects a result after the project changes', () => {
    expect(
      shouldApplyVideoTextOptimizationResult({
        target: { projectId: 'project-1', shotId: 'shot-1', value: 'original' },
        currentProjectId: 'project-2',
        currentShotId: 'shot-1',
        currentValue: 'original',
      }),
    ).toBe(false)
  })

  it('rejects a result after the active shot changes', () => {
    expect(
      shouldApplyVideoTextOptimizationResult({
        target: { projectId: 'project-1', shotId: 'shot-1', value: 'original' },
        currentProjectId: 'project-1',
        currentShotId: 'shot-2',
        currentValue: 'original',
      }),
    ).toBe(false)
  })

  it('rejects a result after the source value is edited', () => {
    expect(
      shouldApplyVideoTextOptimizationResult({
        target: { projectId: 'project-1', shotId: 'shot-1', value: 'original' },
        currentProjectId: 'project-1',
        currentShotId: 'shot-1',
        currentValue: 'edited',
      }),
    ).toBe(false)
  })
})
