import { GENERATION_TASK_STATUSES, GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { GenerationTask, GenerationTaskStatus, GenerationTaskType } from './generation.types'

export interface BackendGenerationTaskDTO {
  id?: string | number | null
  taskId?: string | number | null
  projectId?: string | number | null
  storyboardId?: string | number | null
  shotId?: string | number | null
  requestId?: string | null
  taskType?: string | null
  type?: string | null
  status?: string | null
  progress?: number | null
  result?: unknown
  resultUrl?: string | null
  errorMessage?: string | null
  errorMsg?: string | null
  payload?: Record<string, unknown> | null
  createTime?: string | null
  createdAt?: string | null
  updateTime?: string | null
  updatedAt?: string | null
}

const taskTypes = new Set<string>(Object.values(GENERATION_TASK_TYPES))
const taskStatuses = new Set<string>(Object.values(GENERATION_TASK_STATUSES))

const requireIdentifier = (value: string | number | null | undefined, code: string): string => {
  if (value === null || value === undefined || value === '') {
    throw new Error(code)
  }
  return String(value)
}

const normalizeTaskType = (value?: string | null): GenerationTaskType => {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!taskTypes.has(normalized)) {
    throw new Error(`GENERATION_TASK_TYPE_UNSUPPORTED:${value ?? 'missing'}`)
  }
  return normalized as GenerationTaskType
}

const normalizeTaskStatus = (value?: string | null): GenerationTaskStatus => {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!taskStatuses.has(normalized)) {
    throw new Error(`GENERATION_TASK_STATUS_UNSUPPORTED:${value ?? 'missing'}`)
  }
  return normalized as GenerationTaskStatus
}

export const mapBackendGenerationTask = (task: BackendGenerationTaskDTO): GenerationTask => ({
  id: requireIdentifier(task.id ?? task.taskId, 'GENERATION_TASK_ID_MISSING'),
  projectId: requireIdentifier(task.projectId, 'GENERATION_TASK_PROJECT_ID_MISSING'),
  shotId:
    task.shotId !== null && task.shotId !== undefined
      ? String(task.shotId)
      : task.storyboardId !== null && task.storyboardId !== undefined
        ? String(task.storyboardId)
        : undefined,
  requestId: task.requestId ?? undefined,
  type: normalizeTaskType(task.type ?? task.taskType),
  status: normalizeTaskStatus(task.status),
  progress: typeof task.progress === 'number' ? task.progress : 0,
  result: task.result ?? (task.resultUrl ? { url: task.resultUrl } : undefined),
  errorMessage: task.errorMessage ?? task.errorMsg ?? undefined,
  payload: task.payload ?? undefined,
  createdAt: task.createdAt ?? task.createTime ?? '',
  updatedAt: task.updatedAt ?? task.updateTime ?? task.createdAt ?? task.createTime ?? '',
})
