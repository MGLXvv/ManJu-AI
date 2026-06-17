import type { GenerationTask } from '../generation.types'

export type MockGenerationTaskSettlement = Pick<
  GenerationTask,
  'status' | 'progress' | 'result' | 'errorMessage'
>
