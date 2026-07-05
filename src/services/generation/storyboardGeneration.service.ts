import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { apiMode } from '@/api/shared/apiMode'
import { storyboardImageTaskService } from '@/services/editor/storyboardImageTask.service'
import { storyboardWorkflowService } from '@/services/editor/storyboardWorkflow.service'
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

const STORYBOARD_IMAGE_REQUIRES_CHARACTER_AND_SCENE = 'STORYBOARD_IMAGE_REQUIRES_CHARACTER_AND_SCENE'

const assertShotHasRequiredTags = (shot: StoryboardShot): void => {
  if (shot.characters.length === 0 || shot.scenes.length === 0) {
    throw new Error(STORYBOARD_IMAGE_REQUIRES_CHARACTER_AND_SCENE)
  }
}

export const storyboardGenerationService = {
  async generateShotImage(input: GenerateStoryboardImageInput): Promise<StoryboardImageResult> {
    assertShotHasRequiredTags(input.shot)

    if (apiMode === 'http') {
      if (isLocalStoryboardShotId(input.shot.id)) {
        throw new Error('STORYBOARD_IMAGE_REQUIRES_PERSISTED_SHOT')
      }

      const task = await storyboardImageTaskService.createStoryboardImageTask(input.shot.id, input.shot.prompt)
      const workspacePatch = await storyboardWorkflowService.loadStoryboardWorkspace(input.projectId)
      const refreshedDraftShot = workspacePatch?.shots.find((shot) => shot.id === input.shot.id)
      const imageUrl = refreshedDraftShot?.imageUrl ?? task?.resultUrl ?? ''
      const refreshedShot: StoryboardShot | undefined = refreshedDraftShot
        ? {
            ...input.shot,
            id: refreshedDraftShot.id,
            index: refreshedDraftShot.index,
            title: refreshedDraftShot.title,
            imageUrl: refreshedDraftShot.imageUrl,
            videoUrl: refreshedDraftShot.videoUrl,
            durationSeconds: refreshedDraftShot.durationSeconds,
            status: imageUrl ? 'success' : 'failed',
            createdAt: refreshedDraftShot.createdAt || input.shot.createdAt,
          }
        : undefined

      return assertStoryboardImageResult({
        shotId: input.shot.id,
        imageUrl,
        shot: refreshedShot ?? {
          ...input.shot,
          imageUrl,
          status: imageUrl ? 'success' : 'failed',
        },
      })
    }

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
