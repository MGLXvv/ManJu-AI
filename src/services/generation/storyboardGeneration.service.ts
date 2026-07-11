import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import { validateMultiParamShotParameters } from '@/features/editor/storyboardParameterValidationState'
import { resolveImmediateAiTaskResultUrl } from '@/services/editor/aiTaskResultState'
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
  StoryboardImageTaskResult,
  StoryboardUpscaleResult,
  StoryboardUpscaleTaskResult,
} from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'
import { generationWorkspaceRefreshService } from './generationWorkspaceRefresh.service'

export interface GenerateStoryboardImageInput {
  projectId: string
  shot: StoryboardShot
}

export interface UpscaleStoryboardImageInput {
  projectId: string
  shot: StoryboardShot
}

const STORYBOARD_IMAGE_REQUIRES_REQUIRED_PARAMETERS = 'STORYBOARD_IMAGE_REQUIRES_REQUIRED_PARAMETERS'

const assertShotHasRequiredParameters = (shot: StoryboardShot): void => {
  const result = validateMultiParamShotParameters(shot)
  if (!result.ok) {
    throw new Error(`${STORYBOARD_IMAGE_REQUIRES_REQUIRED_PARAMETERS}:${result.missingFields.join('|')}`)
  }
}

const buildStoryboardGeneratePayload = (shot: StoryboardShot): StoryboardGeneratePayload => ({
  shotId: shot.id,
  title: shot.title,
  prompt: shot.prompt,
  style: shot.style,
  ratio: shot.ratio,
  characters: shot.characters,
  scenes: shot.scenes,
  props: shot.props,
  referenceImages: shot.referenceImages,
  shot,
})

export const storyboardGenerationService = {
  async generateShotImage(input: GenerateStoryboardImageInput): Promise<StoryboardImageResult> {
    assertShotHasRequiredParameters(input.shot)

    if (isMockMode) {
      const payload = buildStoryboardGeneratePayload(input.shot)
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

      const taskResult = assertStoryboardImageResult(
        task.result as Partial<StoryboardImageTaskResult> | undefined,
      )
      return generationWorkspaceRefreshService.resolveStoryboardImage(input.projectId, input.shot, taskResult)
    }

    if (isLocalStoryboardShotId(input.shot.id)) {
      throw new Error('STORYBOARD_IMAGE_REQUIRES_PERSISTED_SHOT')
    }

    const task = await storyboardImageTaskService.createStoryboardImageTask(input.shot.id, input.shot.prompt)
    const workspacePatch = await storyboardWorkflowService.loadStoryboardWorkspace(input.projectId)
    const refreshedDraftShot = workspacePatch?.shots.find((shot) => shot.id === input.shot.id)
    const imageUrl = resolveImmediateAiTaskResultUrl({
      task,
      workspaceResultUrl: refreshedDraftShot?.imageUrl,
    })
    const taskResult = assertStoryboardImageResult({
      shotId: input.shot.id,
      imageUrl,
    })
    return generationWorkspaceRefreshService.resolveStoryboardImage(input.projectId, input.shot, taskResult)
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

    const taskResult = assertStoryboardUpscaleResult(
      task.result as Partial<StoryboardUpscaleTaskResult> | undefined,
    )
    return generationWorkspaceRefreshService.resolveStoryboardUpscale(input.projectId, input.shot, taskResult)
  },
}
