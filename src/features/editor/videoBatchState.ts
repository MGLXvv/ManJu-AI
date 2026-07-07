import { validateStoryboardShotVideoSource } from '@/features/editor/storyboardParameterValidationState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { StoryboardShot } from '@/types/storyboard'

export interface ResolveVideoBatchAvailabilityInput {
  shots: StoryboardShot[]
  selectedShotIds: string[]
  overwriteGenerated?: boolean
  storyboardMode?: StoryboardMode
}

export interface VideoBatchAvailability {
  totalCount: number
  selectedCount: number
  targetIds: string[]
  hiddenCount: number
  lockedCount: number
  missingImageCount: number
  missingParameterCount: number
  generatedCount: number
  unavailableCount: number
  canGenerate: boolean
  disabledReason: string
}

export const canBatchGenerateVideoShot = (
  shot: StoryboardShot,
  overwriteGenerated = false,
  storyboardMode: StoryboardMode = 'image',
): boolean =>
  !shot.isLocked &&
  !shot.isHidden &&
  validateStoryboardShotVideoSource(shot, storyboardMode).ok &&
  shot.status !== 'generating' &&
  (overwriteGenerated || !shot.videoUrl)

export const resolveVideoBatchAvailability = ({
  shots,
  selectedShotIds,
  overwriteGenerated = false,
  storyboardMode = 'image',
}: ResolveVideoBatchAvailabilityInput): VideoBatchAvailability => {
  const selectedIdSet = new Set(selectedShotIds)
  const selectedShots = shots.filter((shot) => selectedIdSet.has(shot.id))

  let hiddenCount = 0
  let lockedCount = 0
  let missingImageCount = 0
  let missingParameterCount = 0
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

      const sourceValidation = validateStoryboardShotVideoSource(shot, storyboardMode)
      if (!sourceValidation.ok) {
        if (storyboardMode === 'multi-param') {
          missingParameterCount += 1
        } else {
          missingImageCount += 1
        }
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
  } else if (targetIds.length === 0 && missingParameterCount === selectedCount) {
    disabledReason = '请先补全角色、画面描述、图像风格和画面比例；场景标签可选，画面描述可作为场景上下文'
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
    missingParameterCount,
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
  storyboardMode: StoryboardMode = 'image',
): StoryboardShot[] => {
  const targetIds = new Set(
    resolveVideoBatchTargetIds({
      shots,
      selectedShotIds: selectedIds,
      storyboardMode,
    }),
  )
  return shots.filter((shot) => targetIds.has(shot.id))
}

export const resolveSelectableVideoBatchShotIds = (shots: StoryboardShot[], storyboardMode: StoryboardMode = 'image'): string[] =>
  shots.filter((shot) => canBatchGenerateVideoShot(shot, false, storyboardMode)).map((shot) => shot.id)
