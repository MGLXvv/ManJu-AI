export type { GenerationTaskStatus, GenerationTaskType } from './api-enums'
import type { GenerationTaskStatus, GenerationTaskType } from './api-enums'

export interface CreateGenerationTaskInput {
  projectId: string
  type: GenerationTaskType
  shotId?: string
  payload?: Record<string, unknown>
}

export interface GenerationTask {
  id: string
  projectId: string
  shotId?: string
  type: GenerationTaskType
  status: GenerationTaskStatus
  progress: number
  result?: unknown
  errorMessage?: string
  payload?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
