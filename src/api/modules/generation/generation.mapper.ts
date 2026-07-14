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

const normalizeTaskType = (value?: string | null): GenerationTaskType => {
  const normalized = value?.trim().toLowerCase() ?? ''
  return taskTypes.has(normalized) ? (normalized as GenerationTaskType) : GENERATION_TASK_TYPES.script
}

const normalizeTaskStatus = (value?: string | null): GenerationTaskStatus => {
  const normalized = value?.trim().toLowerCase() ?? ''
  return taskStatuses.has(normalized) ? (normalized as GenerationTaskStatus) : GENERATION_TASK_STATUSES.queued
}

export const mapBackendGenerationTask = (task: BackendGenerationTaskDTO): GenerationTask => ({
  id: String(task.id ?? task.taskId ?? ''),
  projectId: String(task.projectId ?? ''),
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
