import { buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import type { StoryboardShot } from '@/types/storyboard'

export interface VideoDubbingValidationResult {
  ok: boolean
  message: string
}

export const buildVideoExportFileName = (projectId: string): string => {
  return buildProjectArtifactFileName(projectId || 'video', 'video')
}

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
