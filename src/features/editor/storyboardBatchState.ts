import type { StoryboardShot } from '@/types/storyboard'

export const STORYBOARD_GENERATION_SPEEDS = ['fast', 'standard', 'quality'] as const

export type StoryboardGenerationSpeed = (typeof STORYBOARD_GENERATION_SPEEDS)[number]

export const STORYBOARD_OVERWRITE_STRATEGIES = ['overwrite-generated', 'skip-generated'] as const

export type StoryboardOverwriteStrategy = (typeof STORYBOARD_OVERWRITE_STRATEGIES)[number]

export interface ResolveStoryboardBatchTargetIdsInput {
  shots: StoryboardShot[]
  selectedShotIds: string[]
  overwriteStrategy: StoryboardOverwriteStrategy
}

export const resolveStoryboardBatchTargetIds = (input: ResolveStoryboardBatchTargetIdsInput): string[] => {
  const selectedShotIds = new Set(input.selectedShotIds)

  return input.shots
    .filter((shot) => selectedShotIds.has(shot.id))
    .filter((shot) => !shot.isHidden && !shot.isLocked)
    .filter((shot) => input.overwriteStrategy === 'overwrite-generated' || shot.status !== 'success')
    .map((shot) => shot.id)
}
