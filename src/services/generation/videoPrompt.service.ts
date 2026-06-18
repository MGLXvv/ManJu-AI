import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { VideoOptimizePayload } from './generationPayload.types'
import { assertVideoOptimizeResult } from './generationResultGuards'
import type { VideoOptimizeResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface OptimizeVideoPromptInput {
  projectId: string
  shotId?: string
  prompt: string
}

export interface OptimizeVideoDialogueInput {
  projectId: string
  shotId?: string
  dialogue: string
}

export const videoPromptService = {
  async optimizeVideoPrompt(input: OptimizeVideoPromptInput): Promise<VideoOptimizeResult> {
    const payload: VideoOptimizePayload = {
      shotId: input.shotId,
      mode: 'videoPrompt',
      value: input.prompt,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.videoOptimize,
        shotId: input.shotId,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertVideoOptimizeResult(task.result as Partial<VideoOptimizeResult> | undefined)
  },

  async optimizeDialogue(input: OptimizeVideoDialogueInput): Promise<VideoOptimizeResult> {
    const payload: VideoOptimizePayload = {
      shotId: input.shotId,
      mode: 'dialogue',
      value: input.dialogue,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.videoOptimize,
        shotId: input.shotId,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertVideoOptimizeResult(task.result as Partial<VideoOptimizeResult> | undefined)
  },
}
