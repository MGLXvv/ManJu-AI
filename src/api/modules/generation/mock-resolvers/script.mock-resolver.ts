import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { generateMockScript, optimizeMockScript } from '@/features/editor/scriptGenerationState'
import type { GenerationTask } from '../generation.types'
import type { MockGenerationTaskSettlement } from './types'

export const resolveScriptMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type !== 'script' && task.type !== 'script_optimize') {
    return null
  }

  const script =
    task.type === 'script'
      ? generateMockScript({
          sourceText: String(task.payload?.sourceText ?? ''),
          promptText: String(task.payload?.promptText ?? ''),
        })
      : optimizeMockScript(String(task.payload?.scriptText ?? ''))

  return {
    status: GENERATION_TASK_STATUSES.success,
    progress: 100,
    result: { script },
    errorMessage: undefined,
  }
}
