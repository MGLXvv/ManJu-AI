import { buildMockAudioDataUrl } from '@/features/editor/dubbingAudioState'
import { shouldMockDubbingGenerateFail } from '@/features/editor/dubbingGenerationState'
import type { DubbingGeneratePayload } from '@/services/generation/generationPayload.types'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '../generation.types'
import type { MockGenerationTaskSettlement } from './types'

export const resolveDubbingMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type !== 'dubbing') {
    return null
  }

  const payload = task.payload as Partial<DubbingGeneratePayload> | undefined
  const card = payload?.card
  const title = String(payload?.title ?? card?.title ?? '')
  const modelId = String(payload?.modelId ?? '')
  const lines = Array.isArray(payload?.lines) ? payload.lines : card?.lines ?? []

  if (
    shouldMockDubbingGenerateFail({
      title,
      lines: lines.map((line) => line.text),
    })
  ) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.dubbingGenerateFailed,
      result: task.result,
    }
  }

  if (!card) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.dubbingGenerateFailed,
      result: task.result,
    }
  }

  const nextLines = card.lines.map((line) => ({
    ...line,
    status: 'success' as const,
    audioUrl: buildMockAudioDataUrl({
      seed: `${card.title}-${line.shotId}-${modelId}`,
      durationMs: 720,
    }),
  }))

  return {
    status: GENERATION_TASK_STATUSES.success,
    progress: 100,
    result: {
      cardId: card.id,
      lineIds: nextLines.map((line) => line.id),
      lines: nextLines,
    },
    errorMessage: undefined,
  }
}
