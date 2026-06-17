import { API_ERROR_CODES, GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { StoryboardOptimizePayload } from './generationPayload.types'
import { assertStoryboardPromptResult } from './generationResultGuards'
import type {
  StoryboardPromptOptimizeBatchItem,
  StoryboardPromptOptimizeBatchResult,
  StoryboardPromptOptimizeResult,
} from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface OptimizeStoryboardPromptInput {
  projectId: string
  shotId?: string
  prompt: string
  mode: 'active-shot' | 'insert-shot'
}

export interface OptimizeStoryboardPromptBatchItem {
  shotId: string
  prompt: string
}

export interface OptimizeStoryboardPromptBatchInput {
  projectId: string
  items: OptimizeStoryboardPromptBatchItem[]
}

export const storyboardPromptService = {
  async optimizePrompt(input: OptimizeStoryboardPromptInput): Promise<StoryboardPromptOptimizeResult> {
    const payload: StoryboardOptimizePayload = {
      prompt: input.prompt,
      mode: input.mode,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.storyboardOptimize,
        shotId: input.shotId,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertStoryboardPromptResult(task.result as Partial<StoryboardPromptOptimizeResult> | undefined)
  },

  async optimizePrompts(input: OptimizeStoryboardPromptBatchInput): Promise<StoryboardPromptOptimizeBatchResult> {
    const items: StoryboardPromptOptimizeBatchItem[] = []

    for (const item of input.items) {
      try {
        const result = await this.optimizePrompt({
          projectId: input.projectId,
          shotId: item.shotId,
          prompt: item.prompt,
          mode: 'active-shot',
        })

        items.push({
          shotId: item.shotId,
          prompt: result.prompt,
          success: true,
        })
      } catch (error) {
        items.push({
          shotId: item.shotId,
          prompt: item.prompt,
          success: false,
          errorMessage: error instanceof Error ? error.message : API_ERROR_CODES.storyboardOptimizeFailed,
        })
      }
    }

    return { items }
  },
}
