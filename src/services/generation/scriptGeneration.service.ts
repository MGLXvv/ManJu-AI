import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import {
  type ScriptGeneratePayload,
  type ScriptOptimizePayload,
} from './generationPayload.types'
import {
  assertScriptGenerateResult,
  assertScriptOptimizeResult,
} from './generationResultGuards'
import type { ScriptGenerateResult, ScriptOptimizeResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateScriptInput {
  projectId: string
  sourceText: string
  promptText: string
  modelId: string
}

export interface OptimizeScriptInput {
  projectId: string
  scriptText: string
  modelId: string
}

export const scriptGenerationService = {
  async generateScript(input: GenerateScriptInput): Promise<ScriptGenerateResult> {
    const payload: ScriptGeneratePayload = {
      sourceText: input.sourceText,
      promptText: input.promptText,
      modelId: input.modelId,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.script,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertScriptGenerateResult(task.result as Partial<ScriptGenerateResult> | undefined)
  },

  async optimizeScript(input: OptimizeScriptInput): Promise<ScriptOptimizeResult> {
    const payload: ScriptOptimizePayload = {
      scriptText: input.scriptText,
      modelId: input.modelId,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.scriptOptimize,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertScriptOptimizeResult(task.result as Partial<ScriptOptimizeResult> | undefined)
  },
}
