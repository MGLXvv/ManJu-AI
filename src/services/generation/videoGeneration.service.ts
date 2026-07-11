import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import { validateStoryboardShotVideoSource } from '@/features/editor/storyboardParameterValidationState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import { resolveImmediateAiTaskResultUrl } from '@/services/editor/aiTaskResultState'
import { storyboardVideoTaskService } from '@/services/editor/storyboardVideoTask.service'
import { storyboardWorkflowService } from '@/services/editor/storyboardWorkflow.service'
import { API_ERROR_CODES, GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { StoryboardShot } from '@/types/storyboard'
import type { VideoGeneratePayload } from './generationPayload.types'
import { assertVideoGenerateResult } from './generationResultGuards'
import type { VideoGenerateResult, VideoGenerateTaskResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'
import { generationWorkspaceRefreshService } from './generationWorkspaceRefresh.service'

export interface GenerateVideoInput {
  projectId: string
  shot: StoryboardShot
  storyboardMode?: StoryboardMode
}

const assertShotCanGenerateVideo = (shot: StoryboardShot, storyboardMode: StoryboardMode): void => {
  const result = validateStoryboardShotVideoSource(shot, storyboardMode)
  if (result.ok) {
    return
  }

  if (storyboardMode === 'multi-param') {
    throw new Error(API_ERROR_CODES.storyboardVideoParametersRequired)
  }

  throw new Error(API_ERROR_CODES.storyboardVideoImageRequired)
}

const buildVideoGeneratePayload = (shot: StoryboardShot): VideoGeneratePayload => ({
  shotId: shot.id,
  title: shot.title,
  imageUrl: shot.imageUrl,
  videoPrompt: shot.videoPrompt ?? '',
  dialogue: shot.dialogue ?? '',
  durationSeconds: shot.durationSeconds ?? 10,
  voiceAssignments: shot.voiceAssignments ?? [],
  characters: shot.characters,
  scenes: shot.scenes,
  props: shot.props,
  style: shot.style,
  ratio: shot.ratio,
  shot,
})

export const videoGenerationService = {
  async generateVideo(input: GenerateVideoInput): Promise<VideoGenerateResult> {
    const storyboardMode = input.storyboardMode ?? 'image'
    assertShotCanGenerateVideo(input.shot, storyboardMode)

    if (isMockMode) {
      const payload = buildVideoGeneratePayload(input.shot)
      const task = await createAndWaitGenerationTask(
        {
          projectId: input.projectId,
          type: GENERATION_TASK_TYPES.video,
          shotId: input.shot.id,
          payload: payload as Record<string, unknown>,
        },
        {
          interval: 100,
        },
      )

      const taskResult = assertVideoGenerateResult(
        task.result as Partial<VideoGenerateTaskResult> | undefined,
      )
      return generationWorkspaceRefreshService.resolveVideo(input.projectId, input.shot, taskResult)
    }

    if (isLocalStoryboardShotId(input.shot.id)) {
      throw new Error(API_ERROR_CODES.storyboardVideoRequiresPersistedShot)
    }

    const task = await storyboardVideoTaskService.createStoryboardVideoTask(input.shot.id)
    const workspacePatch = await storyboardWorkflowService.loadStoryboardWorkspace(input.projectId)
    const refreshedDraftShot = workspacePatch?.shots.find((shot) => shot.id === input.shot.id)
    const videoUrl = resolveImmediateAiTaskResultUrl({
      task,
      workspaceResultUrl: refreshedDraftShot?.videoUrl,
    })
    const taskResult = assertVideoGenerateResult({
      shotId: input.shot.id,
      videoUrl,
    })
    return generationWorkspaceRefreshService.resolveVideo(input.projectId, input.shot, taskResult)
  },
}
