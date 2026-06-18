import { storyboardApi } from '@/api/storyboard.api'
import {
  optimizeMockVideoDialogue,
  optimizeMockVideoPrompt,
  shouldMockVideoGenerateFail,
} from '@/features/editor/videoGenerationState'
import type { VideoGeneratePayload, VideoOptimizePayload } from '@/services/generation/generationPayload.types'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '../generation.types'
import type { MockGenerationTaskSettlement } from './types'

export const resolveVideoMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type === 'video_optimize') {
    const payload = task.payload as Partial<VideoOptimizePayload> | undefined
    const mode = payload?.mode
    const value = String(payload?.value ?? '')

    try {
      const optimized =
        mode === 'dialogue'
          ? await optimizeMockVideoDialogue(value)
          : await optimizeMockVideoPrompt(value)

      return {
        status: GENERATION_TASK_STATUSES.success,
        progress: 100,
        result: { value: optimized },
        errorMessage: undefined,
      }
    } catch (error) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: error instanceof Error ? error.message : API_ERROR_CODES.videoOptimizeFailed,
        result: task.result,
      }
    }
  }

  if (task.type !== 'video') {
    return null
  }

  const payload = task.payload as Partial<VideoGeneratePayload> | undefined
  const targetShot = payload?.shot
  const title = String(payload?.title ?? targetShot?.title ?? '')
  const videoPrompt = String(payload?.videoPrompt ?? targetShot?.videoPrompt ?? '')
  const dialogue = String(payload?.dialogue ?? targetShot?.dialogue ?? '')

  if (
    shouldMockVideoGenerateFail({
      title,
      videoPrompt,
      dialogue,
    })
  ) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.videoGenerateFailed,
      result: task.result,
    }
  }

  if (!targetShot) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.videoGenerateFailed,
      result: task.result,
    }
  }

  const result = await storyboardApi.generateVideo(targetShot)

  return {
    status: GENERATION_TASK_STATUSES.success,
    progress: 100,
    result: {
      shotId: targetShot.id,
      videoUrl: result.videoUrl,
      shot: result.shot,
    },
    errorMessage: undefined,
  }
}
