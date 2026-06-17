import { buildVideoExportFileName } from '@/features/editor/editorArtifactMapper'
import type { StoryboardShot } from '@/types/storyboard'

export interface VideoDubbingValidationResult {
  ok: boolean
  message: string
}

export { buildVideoExportFileName }

export const validateVideoBeforeDubbing = (shots: StoryboardShot[]): VideoDubbingValidationResult => {
  const hasGeneratedVideo = shots.some((shot) => Boolean(shot.videoUrl))

  if (!hasGeneratedVideo) {
    return {
      ok: false,
      message: '请至少生成一个视频镜头后再进入配音',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
