export interface BackendAiTaskDTO {
  id?: number | string | null
  taskId?: number | string | null
  status?: string | null
  progress?: number | null
  providerTaskId?: string | null
  resultUrl?: string | null
  errorMsg?: string | null
  errorMessage?: string | null
}

export interface EditorAiTask {
  id: string
  status: string
  progress: number
  providerTaskId: string
  resultUrl: string
  errorMessage: string
}

export const mapBackendAiTask = (task: BackendAiTaskDTO): EditorAiTask => ({
  id: String(task.taskId ?? task.id ?? ''),
  status: task.status ?? 'PENDING',
  progress: typeof task.progress === 'number' ? task.progress : 0,
  providerTaskId: task.providerTaskId ?? '',
  resultUrl: task.resultUrl ?? '',
  errorMessage: task.errorMessage ?? task.errorMsg ?? '',
})
