import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { StoryboardShot } from '@/types/storyboard'
import {
  type StoryboardGeneratePayload,
  type StoryboardUpscalePayload,
} from './generationPayload.types'
import {
  assertStoryboardImageResult,
  assertStoryboardUpscaleResult,
} from './generationResultGuards'
import type {
  StoryboardImageResult,
  StoryboardUpscaleResult,
} from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateStoryboardImageInput {
  projectId: string
  shot: StoryboardShot
}

export interface UpscaleStoryboardImageInput {
  projectId: string
  shot: StoryboardShot
}

export const storyboardGenerationService = {
  async generateShotImage(input: GenerateStoryboardImageInput): Promise<StoryboardImageResult> {
    const payload: StoryboardGeneratePayload = {
      shotId: input.shot.id,
      title: input.shot.title,
      prompt: input.shot.prompt,
      style: input.shot.style,
      ratio: input.shot.ratio,
      characters: input.shot.characters,
      scenes: input.shot.scenes,
      props: input.shot.props,
      referenceImages: input.shot.referenceImages,
      shot: input.shot,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.storyboard,
        shotId: input.shot.id,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertStoryboardImageResult(task.result as Partial<StoryboardImageResult> | undefined)
  },

  async upscaleShotImage(input: UpscaleStoryboardImageInput): Promise<StoryboardUpscaleResult> {
    const payload: StoryboardUpscalePayload = {
      shotId: input.shot.id,
      title: input.shot.title,
      imageUrl: input.shot.imageUrl,
      prompt: input.shot.prompt,
      style: input.shot.style,
      ratio: input.shot.ratio,
      shot: input.shot,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.storyboardUpscale,
        shotId: input.shot.id,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertStoryboardUpscaleResult(task.result as Partial<StoryboardUpscaleResult> | undefined)
  },
}
