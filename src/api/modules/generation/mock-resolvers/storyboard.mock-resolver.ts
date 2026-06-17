import { storyboardApi } from '@/api/storyboard.api'
import {
  optimizeMockStoryboardPrompt,
  shouldMockStoryboardGenerateFail,
} from '@/features/editor/storyboardGenerationState'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type {
  StoryboardGeneratePayload,
  StoryboardOptimizePayload,
  StoryboardUpscalePayload,
} from '@/services/generation/generationPayload.types'
import type { GenerationTask } from '../generation.types'
import type { MockGenerationTaskSettlement } from './types'

export const resolveStoryboardMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type === 'storyboard_optimize') {
    const payload = task.payload as Partial<StoryboardOptimizePayload> | undefined
    const prompt = String(payload?.prompt ?? '')
    const optimizedPrompt = optimizeMockStoryboardPrompt(prompt)

    return {
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: { prompt: optimizedPrompt },
      errorMessage: undefined,
    }
  }

  if (task.type === 'storyboard') {
    const payload = task.payload as Partial<StoryboardGeneratePayload> | undefined
    const targetShot = payload?.shot
    const title = String(payload?.title ?? targetShot?.title ?? '')
    const prompt = String(payload?.prompt ?? targetShot?.prompt ?? '')

    if (shouldMockStoryboardGenerateFail({ title, prompt })) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: API_ERROR_CODES.storyboardGenerateFailed,
        result: task.result,
      }
    }

    if (!targetShot) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: API_ERROR_CODES.storyboardGenerateFailed,
        result: task.result,
      }
    }

    const result = await storyboardApi.generateShotImage(targetShot)
    return {
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        shotId: targetShot.id,
        imageUrl: result.imageUrl,
        shot: result.shot,
      },
      errorMessage: undefined,
    }
  }

  if (task.type === 'storyboard_upscale') {
    const payload = task.payload as Partial<StoryboardUpscalePayload> | undefined
    const targetShot = payload?.shot
    const imageUrl = String(payload?.imageUrl ?? targetShot?.imageUrl ?? '')
    const title = String(payload?.title ?? targetShot?.title ?? '')

    if (!imageUrl) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: API_ERROR_CODES.storyboardUpscaleImageRequired,
        result: task.result,
      }
    }

    if (title.includes('#mock-upscale-fail')) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: API_ERROR_CODES.storyboardUpscaleFailed,
        result: task.result,
      }
    }

    if (!targetShot) {
      return {
        status: GENERATION_TASK_STATUSES.failed,
        progress: 100,
        errorMessage: API_ERROR_CODES.storyboardUpscaleFailed,
        result: task.result,
      }
    }

    const result = await storyboardApi.upscaleShotImage(targetShot)
    return {
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        shotId: targetShot.id,
        imageUrl: result.imageUrl,
        shot: result.shot,
      },
      errorMessage: undefined,
    }
  }

  return null
}
