import { buildVideoExportFileName } from '@/features/editor/editorArtifactMapper'
import type { StoryboardShot } from '@/types/storyboard'

export interface VideoDubbingValidationResult {
  ok: boolean
  message: string
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

  if (visibleShots.some((shot) => !shot.videoUrl)) {
    return {
      ok: false,
      message: '请先为所有可见镜头生成视频后再进入配音',
    }
  }

  if (visibleShots.some((shot) => !shot.videoReviewed)) {
    return {
      ok: false,
      message: '请先完成人工审核并标记所有可见视频镜头后再进入配音',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
