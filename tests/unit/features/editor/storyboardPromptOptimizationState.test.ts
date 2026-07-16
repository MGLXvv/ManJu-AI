import { describe, expect, it } from 'vitest'
import {
  shouldApplyActiveStoryboardPromptResult,
  shouldApplyInsertStoryboardPromptResult,
} from '@/features/editor/storyboardPromptOptimizationState'

describe('storyboardPromptOptimizationState', () => {
  it('accepts an active-shot result when project, shot, and prompt are unchanged', () => {
    expect(
      shouldApplyActiveStoryboardPromptResult({
        target: { projectId: 'project-1', shotId: 'shot-1', prompt: 'original' },
        currentProjectId: 'project-1',
        currentShot: { id: 'shot-1', prompt: 'original' },
      }),
    ).toBe(true)
  })

  it('rejects an active-shot result after selection, project, or prompt changes', () => {
    const target = { projectId: 'project-1', shotId: 'shot-1', prompt: 'original' }

    expect(
      shouldApplyActiveStoryboardPromptResult({
        target,
        currentProjectId: 'project-1',
        currentShot: { id: 'shot-2', prompt: 'original' },
      }),
    ).toBe(false)
    expect(
      shouldApplyActiveStoryboardPromptResult({
        target,
        currentProjectId: 'project-2',
        currentShot: { id: 'shot-1', prompt: 'original' },
      }),
    ).toBe(false)
    expect(
      shouldApplyActiveStoryboardPromptResult({
        target,
        currentProjectId: 'project-1',
        currentShot: { id: 'shot-1', prompt: 'edited' },
      }),
    ).toBe(false)
  })

  it('accepts an insert result when project, position, and prompt are unchanged', () => {
    expect(
      shouldApplyInsertStoryboardPromptResult({
        target: { projectId: 'project-1', insertAfterShotId: 'shot-1', prompt: 'original' },
        currentProjectId: 'project-1',
        currentInsertAfterShotId: 'shot-1',
        currentPrompt: 'original',
      }),
    ).toBe(true)
  })

  it('rejects an insert result after its project, position, or prompt changes', () => {
    const target = { projectId: 'project-1', insertAfterShotId: 'shot-1', prompt: 'original' }

    expect(
      shouldApplyInsertStoryboardPromptResult({
        target,
        currentProjectId: 'project-2',
        currentInsertAfterShotId: 'shot-1',
        currentPrompt: 'original',
      }),
    ).toBe(false)
    expect(
      shouldApplyInsertStoryboardPromptResult({
        target,
        currentProjectId: 'project-1',
        currentInsertAfterShotId: 'shot-2',
        currentPrompt: 'original',
      }),
    ).toBe(false)
    expect(
      shouldApplyInsertStoryboardPromptResult({
        target,
        currentProjectId: 'project-1',
        currentInsertAfterShotId: 'shot-1',
        currentPrompt: 'edited',
      }),
    ).toBe(false)
  })
})
