import type { CreateGenerationTaskInput, GenerationTask } from '@/types/generation'
import {
  generationTaskGateway,
  type GenerationTaskWaitOptions,
} from './generationTaskGateway'

export type WaitForTaskOptions = GenerationTaskWaitOptions

export const waitForGenerationTask = (
  taskId: string,
  options: WaitForTaskOptions = {},
): Promise<GenerationTask> => generationTaskGateway.waitForTask(taskId, options)

export const createAndWaitGenerationTask = (
  input: CreateGenerationTaskInput,
  options: WaitForTaskOptions = {},
): Promise<GenerationTask> => generationTaskGateway.createAndWait(input, options)
