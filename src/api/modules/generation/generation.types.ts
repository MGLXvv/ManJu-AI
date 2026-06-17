import type { CreateGenerationTaskInput, GenerationTask, GenerationTaskStatus } from '@/types/generation'

export type { CreateGenerationTaskInput, GenerationTask, GenerationTaskStatus } from '@/types/generation'

export interface GenerationApiContract {
  list(projectId: string): Promise<GenerationTask[]>
  getById(id: string): Promise<GenerationTask | null>
  create(input: CreateGenerationTaskInput): Promise<GenerationTask>
  updateStatus(
    id: string,
    status: GenerationTaskStatus,
    progress: number,
    extras?: Pick<GenerationTask, 'result' | 'errorMessage'>,
  ): Promise<GenerationTask | null>
  cancel(id: string): Promise<GenerationTask | null>
  retry(id: string): Promise<GenerationTask | null>
}
