export type ProjectStatus = 'in_progress' | 'completed'

export type WorkflowStep = 'script' | 'settings' | 'storyboard' | 'video' | 'dubbing' | 'complete'

export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'success' | 'failed'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  currentStep: WorkflowStep
  ratio: '16:9' | '9:16'
  style: string
  updatedAt: string
  duration?: string
  coverUrl?: string
  favorite?: boolean
}

export interface ProjectListQuery {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ProjectStatus | 'all'
}
