import type { EditorAiTask } from '@/api/modules/editor/aiTask.mapper'
import { API_ERROR_CODES } from '@/types/api-enums'

const normalizeTaskStatus = (status: string): string => status.trim().toLocaleLowerCase()

const isTaskFailed = (status: string): boolean => ['failed', 'fail', 'error'].includes(normalizeTaskStatus(status))

const isTaskCancelled = (status: string): boolean => ['cancelled', 'canceled', 'cancel'].includes(normalizeTaskStatus(status))

const isTaskPending = (status: string): boolean =>
  ['pending', 'queued', 'running', 'processing', 'submitted', 'created', 'wait'].includes(normalizeTaskStatus(status))

export interface ResolveImmediateAiTaskResultUrlInput {
  task: EditorAiTask | null
  workspaceResultUrl?: string | null
}

export const resolveImmediateAiTaskResultUrl = ({
  task,
  workspaceResultUrl,
}: ResolveImmediateAiTaskResultUrlInput): string => {
  const refreshedResultUrl = workspaceResultUrl?.trim() ?? ''
  if (refreshedResultUrl) {
    return refreshedResultUrl
  }

  const taskResultUrl = task?.resultUrl.trim() ?? ''
  if (taskResultUrl) {
    return taskResultUrl
  }

  if (!task) {
    return ''
  }

  if (isTaskFailed(task.status)) {
    throw new Error(task.errorMessage || API_ERROR_CODES.generationTaskFailed)
  }

  if (isTaskCancelled(task.status)) {
    throw new Error(API_ERROR_CODES.generationTaskCancelled)
  }

  if (isTaskPending(task.status) || task.id || task.providerTaskId) {
    throw new Error(API_ERROR_CODES.generationTaskHttpPending)
  }

  return ''
}
