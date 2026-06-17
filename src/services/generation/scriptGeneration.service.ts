import { GENERATION_TASK_TYPES } from '@/types/api-enums'
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

export interface GenerateScriptResult {
  script: string
}

export interface OptimizeScriptResult {
  script: string
}

export const scriptGenerationService = {
  async generateScript(input: GenerateScriptInput): Promise<GenerateScriptResult> {
    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.script,
        payload: {
          sourceText: input.sourceText,
          promptText: input.promptText,
          modelId: input.modelId,
        },
      },
      {
        interval: 100,
      },
    )

    const result = task.result as Partial<GenerateScriptResult> | undefined
    if (!result?.script) {
      throw new Error('SCRIPT_GENERATE_FAILED')
    }

    return { script: result.script }
  },

  async optimizeScript(input: OptimizeScriptInput): Promise<OptimizeScriptResult> {
    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.scriptOptimize,
        payload: {
          scriptText: input.scriptText,
          modelId: input.modelId,
        },
      },
      {
        interval: 100,
      },
    )

    const result = task.result as Partial<OptimizeScriptResult> | undefined
    if (!result?.script) {
      throw new Error('SCRIPT_OPTIMIZE_FAILED')
    }

    return { script: result.script }
  },
}
