import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { apiMode } from '@/api/shared/apiMode'
import { validateStoryboardShotVideoSource } from '@/features/editor/storyboardParameterValidationState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import { storyboardVideoTaskService } from '@/services/editor/storyboardVideoTask.service'
import { storyboardWorkflowService } from '@/services/editor/storyboardWorkflow.service'
import { API_ERROR_CODES, GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { StoryboardShot } from '@/types/storyboard'
import type { VideoGeneratePayload } from './generationPayload.types'
import { assertVideoGenerateResult } from './generationResultGuards'
import type { VideoGenerateResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

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

export const videoGenerationService = {
  async generateVideo(input: GenerateVideoInput): Promise<VideoGenerateResult> {
    const storyboardMode = input.storyboardMode ?? 'image'
    assertShotCanGenerateVideo(input.shot, storyboardMode)

    if (apiMode === 'http') {
      if (isLocalStoryboardShotId(input.shot.id)) {
        throw new Error(API_ERROR_CODES.storyboardVideoRequiresPersistedShot)
      }

      const task = await storyboardVideoTaskService.createStoryboardVideoTask(input.shot.id)
      const workspacePatch = await storyboardWorkflowService.loadStoryboardWorkspace(input.projectId)
      const refreshedDraftShot = workspacePatch?.shots.find((shot) => shot.id === input.shot.id)
      const videoUrl = refreshedDraftShot?.videoUrl?.trim() || task?.resultUrl || ''
      const refreshedShot: StoryboardShot | undefined = refreshedDraftShot
        ? {
            ...input.shot,
            id: refreshedDraftShot.id,
            index: refreshedDraftShot.index,
            title: refreshedDraftShot.title,
            imageUrl: refreshedDraftShot.imageUrl || input.shot.imageUrl,
            videoUrl,
            durationSeconds: refreshedDraftShot.durationSeconds,
            status: videoUrl ? 'success' : 'failed',
            createdAt: refreshedDraftShot.createdAt || input.shot.createdAt,
          }
        : undefined

      return assertVideoGenerateResult({
        shotId: input.shot.id,
        videoUrl,
        shot: refreshedShot ?? {
          ...input.shot,
          videoUrl,
          status: videoUrl ? 'success' : 'failed',
        },
      })
    }

    const payload: VideoGeneratePayload = {
      shotId: input.shot.id,
      title: input.shot.title,
      imageUrl: input.shot.imageUrl,
      videoPrompt: input.shot.videoPrompt ?? '',
      dialogue: input.shot.dialogue ?? '',
      durationSeconds: input.shot.durationSeconds ?? 10,
      voiceAssignments: input.shot.voiceAssignments ?? [],
      characters: input.shot.characters,
      scenes: input.shot.scenes,
      props: input.shot.props,
      style: input.shot.style,
      ratio: input.shot.ratio,
      shot: input.shot,
    }

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

    return assertVideoGenerateResult(task.result as Partial<VideoGenerateResult> | undefined)
  },
}
