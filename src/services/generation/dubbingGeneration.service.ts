import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { DubbingGeneratePayload } from './generationPayload.types'
import { assertDubbingGenerateResult } from './generationResultGuards'
import type { DubbingGenerateResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateDubbingCardInput {
  projectId: string
  modelId: string
  card: DubbingRoleCardModel
}

export const dubbingGenerationService = {
  async generateCard(input: GenerateDubbingCardInput): Promise<DubbingGenerateResult> {
    const payload: DubbingGeneratePayload = {
      cardId: input.card.id,
      title: input.card.title,
      modelId: input.modelId,
      selectedVoiceId: input.card.selectedVoiceId,
      lines: input.card.lines,
      card: input.card,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.dubbing,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertDubbingGenerateResult(task.result as Partial<DubbingGenerateResult> | undefined)
  },
}
