import type { Project, ProjectListQuery, WorkflowStep } from '@/types/project'
import type {
  BackendCreateProjectPayload,
  BackendProjectDTO,
  BackendProjectListQuery,
  BackendUpdateProjectPayload,
  CreateProjectInput,
  UpdateProjectInput,
} from './project.types'

const WORKFLOW_STEPS: WorkflowStep[] = ['script', 'settings', 'storyboard', 'video', 'dubbing', 'complete']

const isWorkflowStep = (value: unknown): value is WorkflowStep =>
  typeof value === 'string' && WORKFLOW_STEPS.includes(value as WorkflowStep)

const normalizeProjectStatus = (status?: string): Project['status'] =>
  status === 'COMPLETED' || status === 'completed' ? 'completed' : 'in_progress'

export const mapBackendProjectToProject = (dto: BackendProjectDTO): Project => {
  const status = normalizeProjectStatus(dto.status)
  const currentStep = isWorkflowStep(dto.currentStep)
    ? dto.currentStep
    : status === 'completed'
      ? 'complete'
      : 'script'

  return {
    id: String(dto.id),
    name: dto.name,
    status,
    currentStep,
    ratio: dto.aspectRatio === '9:16' ? '9:16' : '16:9',
    style: dto.style?.trim() ? dto.style : 'anime',
    updatedAt: dto.updateTime || dto.createTime || '',
    duration: typeof dto.durationSeconds === 'number' && dto.durationSeconds > 0 ? `${dto.durationSeconds}s` : undefined,
    coverUrl: dto.coverUrl,
    favorite: false,
  }
}

export const mapBackendProjectListQuery = (query?: ProjectListQuery): BackendProjectListQuery => ({
  pageNo: query?.page,
  pageSize: query?.pageSize,
  keyword: query?.keyword,
  status:
    query?.status === 'completed'
      ? 'COMPLETED'
      : query?.status === 'in_progress'
        ? 'IN_PROGRESS'
        : query?.status === 'all'
          ? 'ALL'
          : undefined,
})

export const mapCreateProjectInputToBackendPayload = (
  input: CreateProjectInput,
): BackendCreateProjectPayload => ({
  name: input.name,
  description: '',
  aspectRatio: input.ratio,
  style: input.style?.trim() ? input.style : 'anime',
  language: 'zh-CN',
  durationSeconds: 60,
})

export const mapUpdateProjectInputToBackendPayload = (
  input: UpdateProjectInput,
): BackendUpdateProjectPayload => ({
  ...(input.name ? { name: input.name } : {}),
  ...(input.status ? { status: input.status === 'completed' ? 'COMPLETED' : 'IN_PROGRESS' } : {}),
})
