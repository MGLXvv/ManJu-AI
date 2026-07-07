import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { StoryboardRatio, StoryboardShot } from '@/types/storyboard'

export interface StoryboardParameterValidationResult {
  ok: boolean
  message: string
  missingFields: string[]
  shotId?: string
}

type MultiParamShotLike = Partial<StoryboardShot> & {
  id: string
  index: number
  description?: string
  characterIds?: string[]
  sceneIds?: string[]
  propIds?: string[]
}

const VALID_RATIOS = new Set<StoryboardRatio>(['16:9', '9:16'])

const buildShotLabel = (shot: MultiParamShotLike): string => shot.title?.trim() || `镜头${shot.index}`

const resolveShotPromptText = (shot: MultiParamShotLike): string => (shot.prompt ?? shot.description ?? '').trim()
const resolveShotStyleText = (shot: MultiParamShotLike): string => (shot.style ?? '').trim()

const hasCharacterParameter = (shot: MultiParamShotLike): boolean => {
  if ((shot.characters?.length ?? 0) > 0) {
    return true
  }

  if ((shot.characterIds?.filter(Boolean).length ?? 0) > 0) {
    return true
  }

  return (shot.voiceAssignments ?? []).some((item) => Boolean(item.characterId))
}

const hasSceneParameter = (shot: MultiParamShotLike): boolean => {
  if ((shot.scenes?.length ?? 0) > 0) {
    return true
  }

  if ((shot.sceneIds?.filter(Boolean).length ?? 0) > 0) {
    return true
  }

  return Boolean(resolveShotPromptText(shot))
}

export const resolveMissingMultiParamFields = (shot: StoryboardShot | MultiParamShotLike): string[] => {
  const missingFields: string[] = []

  if (!hasCharacterParameter(shot)) {
    missingFields.push('角色')
  }

  if (!hasSceneParameter(shot)) {
    missingFields.push('场景')
  }

  if (!resolveShotPromptText(shot)) {
    missingFields.push('画面描述')
  }

  if (!resolveShotStyleText(shot)) {
    missingFields.push('图像风格')
  }

  if (!shot.ratio || !VALID_RATIOS.has(shot.ratio)) {
    missingFields.push('画面比例')
  }

  return missingFields
}

export const validateMultiParamShotParameters = (
  shot: StoryboardShot | MultiParamShotLike,
): StoryboardParameterValidationResult => {
  const missingFields = resolveMissingMultiParamFields(shot)
  if (missingFields.length === 0) {
    return {
      ok: true,
      message: '',
      missingFields,
      shotId: shot.id,
    }
  }

  return {
    ok: false,
    message: `${buildShotLabel(shot)} 多参配置不完整，请补充：${missingFields.join('、')}`,
    missingFields,
    shotId: shot.id,
  }
}

export const validateMultiParamShotsBeforeVideo = (shots: StoryboardShot[]): StoryboardParameterValidationResult => {
  const visibleShots = shots.filter((shot) => !shot.isHidden)
  for (const shot of visibleShots) {
    const result = validateMultiParamShotParameters(shot)
    if (!result.ok) {
      return result
    }
  }

  return {
    ok: true,
    message: '',
    missingFields: [],
  }
}

export const validateStoryboardShotVideoSource = (
  shot: StoryboardShot,
  mode: StoryboardMode,
): StoryboardParameterValidationResult => {
  if (mode === 'multi-param') {
    return validateMultiParamShotParameters(shot)
  }

  if (!(shot.imageUrl ?? '').trim()) {
    return {
      ok: false,
      message: '请先生成或上传分镜图后再生成视频',
      missingFields: ['分镜图片'],
      shotId: shot.id,
    }
  }

  return {
    ok: true,
    message: '',
    missingFields: [],
    shotId: shot.id,
  }
}