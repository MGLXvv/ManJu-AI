export type GenerationTaskType = 'storyboard' | 'video' | 'dubbing'

export type GenerationTaskStatus = 'queued' | 'running' | 'success' | 'failed'

export interface GenerationTask {
  id: string
  projectId: string
  shotId?: string
  type: GenerationTaskType
  status: GenerationTaskStatus
  progress: number
  createdAt: string
  updatedAt: string
}
