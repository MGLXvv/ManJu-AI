import type { SaveDraftResult, EditorDraft } from './editor'
import type { GenerationTask } from './generation'
import type { Project, ProjectListQuery, ProjectStatus, WorkflowStep } from './project'
import type { StoryboardShot, StoryboardTagOptions } from './storyboard'
import type { CreateGenerationTaskInput } from './generation'
import type { GenerationTaskStatus } from './api-enums'

export interface EditorGetDraftRequestDTO {
  projectId: string
}

export interface EditorGetDraftResponseDTO {
  draft: EditorDraft
}

export interface EditorSaveDraftRequestDTO {
  projectId: string
  draft: EditorDraft
}

export interface EditorSaveDraftResponseDTO extends SaveDraftResult {}

export interface GenerationListTasksRequestDTO {
  projectId: string
}

export interface GenerationListTasksResponseDTO {
  tasks: GenerationTask[]
}

export interface GenerationGetTaskRequestDTO {
  id: string
}

export interface GenerationGetTaskResponseDTO {
  task: GenerationTask | null
}

export interface GenerationCreateTaskRequestDTO extends CreateGenerationTaskInput {}

export interface GenerationCreateTaskResponseDTO {
  task: GenerationTask
}

export interface GenerationUpdateTaskStatusRequestDTO {
  id: string
  status: GenerationTaskStatus
  progress: number
  extras?: Pick<GenerationTask, 'result' | 'errorMessage'>
}

export interface GenerationUpdateTaskStatusResponseDTO {
  task: GenerationTask | null
}

export interface GenerationCancelTaskRequestDTO {
  id: string
}

export interface GenerationCancelTaskResponseDTO {
  task: GenerationTask | null
}

export interface GenerationRetryTaskRequestDTO {
  id: string
}

export interface GenerationRetryTaskResponseDTO {
  task: GenerationTask | null
}

export interface StoryboardDefaultsResponseDTO {
  shots: StoryboardShot[]
  tagOptions: StoryboardTagOptions
  styleOptions: string[]
}

export interface ProjectListRequestDTO extends ProjectListQuery {}

export interface ProjectListResponseDTO {
  projects: Project[]
}

export interface ProjectGetByIdRequestDTO {
  id: string
}

export interface ProjectGetByIdResponseDTO {
  project: Project | null
}

export interface ProjectCreateRequestDTO {
  name: string
  ratio: Project['ratio']
  style: string
}

export interface ProjectCreateResponseDTO {
  project: Project
}

export interface ProjectImportItemDTO {
  name: string
  ratio: Project['ratio']
  style: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  duration?: string
  coverUrl?: string
  favorite?: boolean
}

export interface ProjectImportRequestDTO {
  projects: ProjectImportItemDTO[]
}

export interface ProjectImportResponseDTO {
  projects: Project[]
}

export interface ProjectExportRequestDTO {
  id: string
}

export interface ProjectExportResponseDTO {
  project: Project | null
}

export interface ProjectUpdateRequestDTO {
  id: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  name?: string
  favorite?: boolean
}

export interface ProjectUpdateResponseDTO {
  project: Project | null
}

export interface ProjectRemoveRequestDTO {
  id: string
}

export interface ProjectRemoveResponseDTO {
  removed: boolean
}
