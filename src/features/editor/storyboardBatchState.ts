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

export interface StoryboardBatchAvailability {
  totalCount: number
  selectedCount: number
  targetIds: string[]
  hiddenCount: number
  lockedCount: number
  generatedCount: number
  unavailableCount: number
  canGenerate: boolean
  disabledReason: string
}

export const resolveStoryboardBatchAvailability = (
  input: ResolveStoryboardBatchTargetIdsInput,
): StoryboardBatchAvailability => {
  const selectedIdSet = new Set(input.selectedShotIds)
  const selectedShots = input.shots.filter((shot) => selectedIdSet.has(shot.id))

  let hiddenCount = 0
  let lockedCount = 0
  let generatedCount = 0

  const targetIds = selectedShots
    .filter((shot) => {
      if (shot.isHidden) {
        hiddenCount += 1
        return false
      }

      if (shot.isLocked) {
        lockedCount += 1
        return false
      }

      if (input.overwriteStrategy === 'skip-generated' && shot.status === 'success') {
        generatedCount += 1
        return false
      }

      return true
    })
    .map((shot) => shot.id)

  const selectedCount = selectedShots.length
  const unavailableCount = selectedCount - targetIds.length

  let disabledReason = ''

  if (input.shots.length === 0) {
    disabledReason = '当前没有可批量操作的分镜'
  } else if (selectedCount === 0) {
    disabledReason = '请先选择至少一个分镜'
  } else if (targetIds.length === 0 && hiddenCount + lockedCount === selectedCount) {
    disabledReason = '当前选择的分镜均已隐藏或锁定，无法批量生成'
  } else if (targetIds.length === 0 && generatedCount === selectedCount) {
    disabledReason = '当前选择的分镜均已生成，无需重复生成'
  } else if (targetIds.length === 0) {
    disabledReason = '当前选择中没有可生成的分镜'
  }

  return {
    totalCount: input.shots.length,
    selectedCount,
    targetIds,
    hiddenCount,
    lockedCount,
    generatedCount,
    unavailableCount,
    canGenerate: targetIds.length > 0,
    disabledReason,
  }
}

export const resolveStoryboardBatchTargetIds = (input: ResolveStoryboardBatchTargetIdsInput): string[] =>
  resolveStoryboardBatchAvailability(input).targetIds
