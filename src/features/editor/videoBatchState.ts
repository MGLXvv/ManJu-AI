import type { StoryboardShot } from '@/types/storyboard'

export interface ResolveVideoBatchAvailabilityInput {
  shots: StoryboardShot[]
  selectedShotIds: string[]
  overwriteGenerated?: boolean
}

export interface VideoBatchAvailability {
  totalCount: number
  selectedCount: number
  targetIds: string[]
  hiddenCount: number
  lockedCount: number
  missingImageCount: number
  generatedCount: number
  unavailableCount: number
  canGenerate: boolean
  disabledReason: string
}

export const canBatchGenerateVideoShot = (
  shot: StoryboardShot,
  overwriteGenerated = false,
): boolean =>
  !shot.isLocked &&
  !shot.isHidden &&
  (shot.imageUrl ?? '').trim().length > 0 &&
  shot.status !== 'generating' &&
  (overwriteGenerated || !shot.videoUrl)

export const resolveVideoBatchAvailability = ({
  shots,
  selectedShotIds,
  overwriteGenerated = false,
}: ResolveVideoBatchAvailabilityInput): VideoBatchAvailability => {
  const selectedIdSet = new Set(selectedShotIds)
  const selectedShots = shots.filter((shot) => selectedIdSet.has(shot.id))

  let hiddenCount = 0
  let lockedCount = 0
  let missingImageCount = 0
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

      if (!(shot.imageUrl ?? '').trim()) {
        missingImageCount += 1
        return false
      }

      if (!overwriteGenerated && shot.videoUrl) {
        generatedCount += 1
        return false
      }

      if (shot.status === 'generating') {
        return false
      }

      return true
    })
    .map((shot) => shot.id)

  const selectedCount = selectedShots.length
  const unavailableCount = selectedCount - targetIds.length

  let disabledReason = ''

  if (shots.length === 0) {
    disabledReason = '当前没有可生成视频的分镜'
  } else if (selectedCount === 0) {
    disabledReason = '请先选择至少一个分镜'
  } else if (targetIds.length === 0 && hiddenCount + lockedCount === selectedCount) {
    disabledReason = '当前选择的分镜均已隐藏或锁定，无法批量生成视频'
  } else if (targetIds.length === 0 && missingImageCount === selectedCount) {
    disabledReason = '当前选择的分镜均缺少图片，请先生成或上传分镜图'
  } else if (targetIds.length === 0 && generatedCount === selectedCount) {
    disabledReason = '当前选择的分镜均已生成视频，无需重复生成'
  } else if (targetIds.length === 0) {
    disabledReason = '当前选择中没有可生成视频的分镜'
  }

  return {
    totalCount: shots.length,
    selectedCount,
    targetIds,
    hiddenCount,
    lockedCount,
    missingImageCount,
    generatedCount,
    unavailableCount,
    canGenerate: targetIds.length > 0,
    disabledReason,
  }
}

export const resolveVideoBatchTargetIds = (input: ResolveVideoBatchAvailabilityInput): string[] =>
  resolveVideoBatchAvailability(input).targetIds

export const resolveVideoBatchGenerateTargets = (
  shots: StoryboardShot[],
  selectedIds: string[],
): StoryboardShot[] => {
  const targetIds = new Set(
    resolveVideoBatchTargetIds({
      shots,
      selectedShotIds: selectedIds,
    }),
  )
  return shots.filter((shot) => targetIds.has(shot.id))
}

export const resolveSelectableVideoBatchShotIds = (shots: StoryboardShot[]): string[] =>
  shots.filter((shot) => canBatchGenerateVideoShot(shot)).map((shot) => shot.id)
