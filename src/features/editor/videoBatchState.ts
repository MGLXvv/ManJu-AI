import type { StoryboardShot } from '@/types/storyboard'

export const canBatchGenerateVideoShot = (shot: StoryboardShot): boolean =>
  !shot.isLocked && !shot.isHidden && !shot.videoUrl && shot.status !== 'generating'

export const resolveVideoBatchGenerateTargets = (
  shots: StoryboardShot[],
  selectedIds: string[],
): StoryboardShot[] => {
  const selectedIdSet = new Set(selectedIds)
  return shots.filter((shot) => selectedIdSet.has(shot.id) && canBatchGenerateVideoShot(shot))
}

export const resolveSelectableVideoBatchShotIds = (shots: StoryboardShot[]): string[] =>
  shots.filter(canBatchGenerateVideoShot).map((shot) => shot.id)
