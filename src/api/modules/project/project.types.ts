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

export interface ProjectApiContract {
  list(query?: ProjectListQuery): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(input: CreateProjectInput): Promise<Project>
  importProjects(inputs: ImportProjectInput[]): Promise<Project[]>
  exportProject(id: string): Promise<Project | null>
  update(input: UpdateProjectInput): Promise<Project | null>
  remove(id: string): Promise<void>
}
