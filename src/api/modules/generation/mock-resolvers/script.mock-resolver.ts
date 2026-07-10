import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '../generation.types'
import { generateMockScript, optimizeMockScript } from './mockGeneration.helpers'
import type { MockGenerationTaskSettlement } from './types'

export const resolveScriptMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type !== 'script' && task.type !== 'script_optimize') {
    return null
  }

  const script =
    task.type === 'script'
      ? generateMockScript(
          String(task.payload?.sourceText ?? ''),
          String(task.payload?.promptText ?? ''),
        )
      : optimizeMockScript(String(task.payload?.scriptText ?? ''))

  return {
    status: GENERATION_TASK_STATUSES.success,
    progress: 100,
    result: { script },
    errorMessage: undefined,
  }
}
