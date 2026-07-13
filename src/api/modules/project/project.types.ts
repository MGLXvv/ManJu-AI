import type { Project, ProjectListQuery, ProjectStatus, WorkflowStep } from '@/types/project'

export interface CreateProjectInput {
  name: string
  ratio: Project['ratio']
  style: string
}

export interface UpdateProjectInput {
  id: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  name?: string
  favorite?: boolean
}

export interface ImportProjectInput {
  name: string
  ratio: Project['ratio']
  style: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  duration?: string
  coverUrl?: string
  favorite?: boolean
}

export interface BackendProjectDTO {
  id: number | string
  name: string
  description?: string | null
  status?: string
  statusLabel?: string | null
  statusTag?: string | null
  latestTaskStatus?: string | null
  latestErrorMessage?: string | null
  currentStep?: string
  aspectRatio?: string
  style?: string
  language?: string
  durationSeconds?: number
  coverUrl?: string | null
  createTime?: string
  updateTime?: string
}

export interface BackendProjectPageDTO {
  list?: BackendProjectDTO[]
  total?: number
}

export interface BackendProjectListQuery {
  pageNo?: number
  pageSize?: number
  keyword?: string
  status?: 'ALL' | 'IN_PROGRESS' | 'COMPLETED'
}

export interface BackendCreateProjectPayload {
  name: string
  description: string
  aspectRatio: Project['ratio']
  style: string
  language: string
  durationSeconds: number
}

export interface BackendUpdateProjectPayload {
  name?: string
  status?: 'IN_PROGRESS' | 'COMPLETED'
}

export interface ProjectApiContract {
  list(query?: ProjectListQuery): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(input: CreateProjectInput): Promise<Project>
  importProjects(inputs: ImportProjectInput[]): Promise<Project[]>
  exportProject(id: string): Promise<Project | null>
  update(input: UpdateProjectInput): Promise<Project | null>
  remove(id: string): Promise<void>
}
