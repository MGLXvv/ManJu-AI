import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { StoryboardShot } from '@/types/storyboard'

export interface StoryboardParameterValidationResult {
  ok: boolean
  message: string
  missingFields: string[]
}

const VALID_RATIOS = new Set(['16:9', '9:16'])

const buildShotLabel = (shot: StoryboardShot): string => shot.title?.trim() || `镜头${shot.index}`

export const resolveMissingMultiParamFields = (shot: StoryboardShot): string[] => {
  const missingFields: string[] = []

  if (shot.characters.length === 0) {
    missingFields.push('角色')
  }

  if (shot.scenes.length === 0) {
    missingFields.push('场景')
  }

  if (shot.props.length === 0) {
    missingFields.push('道具')
  }

  if (!shot.prompt.trim()) {
    missingFields.push('画面描述')
  }

  if (!shot.style.trim()) {
    missingFields.push('图像风格')
  }

  if (!VALID_RATIOS.has(shot.ratio)) {
    missingFields.push('画面比例')
  }

  return missingFields
}

export const validateMultiParamShotParameters = (shot: StoryboardShot): StoryboardParameterValidationResult => {
  const missingFields = resolveMissingMultiParamFields(shot)
  if (missingFields.length === 0) {
    return {
      ok: true,
      message: '',
      missingFields,
    }
  }

  return {
    ok: false,
    message: `${buildShotLabel(shot)} 多参配置不完整，请补全：${missingFields.join('、')}`,
    missingFields,
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
    }
  }

  return {
    ok: true,
    message: '',
    missingFields: [],
  }
}
