import { buildVideoExportFileName } from '@/features/editor/editorArtifactMapper'
import type { StoryboardShot } from '@/types/storyboard'

export interface VideoDubbingValidationResult {
  ok: boolean
  message: string
  shotId?: string
}

export { buildVideoExportFileName }

export const validateVideoBeforeDubbing = (shots: StoryboardShot[]): VideoDubbingValidationResult => {
  const visibleShots = shots.filter((shot) => !shot.isHidden)

  if (visibleShots.length === 0) {
    return {
      ok: false,
      message: '请至少保留一个可见视频镜头后再进入配音',
    }
  }

  const firstMissingVideoShot = visibleShots.find((shot) => !(shot.videoUrl ?? '').trim())
  if (firstMissingVideoShot) {
    return {
      ok: false,
      message: '请先为所有可见镜头生成视频后再进入配音',
      shotId: firstMissingVideoShot.id,
    }
  }

  const firstUnreviewedShot = visibleShots.find((shot) => !shot.videoReviewed)
  if (firstUnreviewedShot) {
    return {
      ok: false,
      message: '请先完成人工审核并标记所有可见视频镜头后再进入配音',
      shotId: firstUnreviewedShot.id,
    }
  }

  return {
    ok: true,
    message: '',
  }
}
