import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { StoryboardShot } from '@/types/storyboard'
import type { VideoGeneratePayload } from './generationPayload.types'
import { assertVideoGenerateResult } from './generationResultGuards'
import type { VideoGenerateResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateVideoInput {
  projectId: string
  shot: StoryboardShot
}

export const videoGenerationService = {
  async generateVideo(input: GenerateVideoInput): Promise<VideoGenerateResult> {
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
