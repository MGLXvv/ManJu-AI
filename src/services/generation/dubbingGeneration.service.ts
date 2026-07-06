import { isLocalStoryboardShotId } from '@/api/modules/editor/storyboard.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import { resolveImmediateAiTaskResultUrl } from '@/services/editor/aiTaskResultState'
import { storyboardVoiceTaskService } from '@/services/editor/storyboardVoiceTask.service'
import { API_ERROR_CODES, GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import type { DubbingGeneratePayload } from './generationPayload.types'
import { assertDubbingGenerateResult } from './generationResultGuards'
import type { DubbingGenerateResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateDubbingCardInput {
  projectId: string
  modelId: string
  card: DubbingRoleCardModel
}

const buildDubbingGeneratePayload = (input: GenerateDubbingCardInput): DubbingGeneratePayload => ({
  cardId: input.card.id,
  title: input.card.title,
  modelId: input.modelId,
  selectedVoiceId: input.card.selectedVoiceId,
  lines: input.card.lines,
  card: input.card,
})

export const dubbingGenerationService = {
  async generateCard(input: GenerateDubbingCardInput): Promise<DubbingGenerateResult> {
    if (isMockMode) {
      const payload = buildDubbingGeneratePayload(input)
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
    }

    const lines: DubbingRoleLineDraft[] = []

    for (const line of input.card.lines) {
      if (isLocalStoryboardShotId(line.shotId)) {
        throw new Error(API_ERROR_CODES.storyboardVoiceRequiresPersistedShot)
      }

      if (!line.text.trim()) {
        throw new Error(API_ERROR_CODES.storyboardVoiceDialogueRequired)
      }

      const task = await storyboardVoiceTaskService.createStoryboardVoiceTask(line.shotId)
      const audioUrl = resolveImmediateAiTaskResultUrl({ task })

      lines.push({
        ...line,
        audioUrl,
        status: audioUrl ? 'success' : 'failed',
      })
    }

    return assertDubbingGenerateResult({
      cardId: input.card.id,
      lines,
      lineIds: lines.map((line) => line.id),
    })
  },
}
