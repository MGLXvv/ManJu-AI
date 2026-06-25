import type {
  BackendExportDownloadDTO,
  BackendExportTaskDTO,
  BackendExportWorkspaceDTO,
} from '@/types/api-dto'

export interface EditorExportTask {
  id: string
  status: string
  progress: number
  resultUrl: string
  errorMessage: string
}

export interface EditorExportWorkspace {
  canExport: boolean
  missingVideoCount: number
  latestTask: EditorExportTask | null
  tasks: EditorExportTask[]
}

export const mapBackendExportTask = (task: BackendExportTaskDTO): EditorExportTask => ({
  id: String(task.exportTaskId ?? task.id ?? ''),
  status: task.status ?? 'PENDING',
  progress: typeof task.progress === 'number' ? task.progress : 0,
  resultUrl: task.resultUrl ?? '',
  errorMessage: task.errorMessage ?? task.errorMsg ?? '',
})

export const resolveBackendExportTaskList = (workspace: BackendExportWorkspaceDTO): BackendExportTaskDTO[] => {
  if (Array.isArray(workspace.histories)) {
    return workspace.histories
  }

  if (Array.isArray(workspace.exports)) {
    return workspace.exports
  }

  if (Array.isArray(workspace.list)) {
    return workspace.list
  }

  return []
}

export const mapBackendExportWorkspace = (workspace: BackendExportWorkspaceDTO): EditorExportWorkspace => ({
  canExport: workspace.canExport === true,
  missingVideoCount: typeof workspace.missingVideoCount === 'number' ? workspace.missingVideoCount : 0,
  latestTask: workspace.latestTask
    ? mapBackendExportTask(workspace.latestTask)
    : workspace.recentTask
      ? mapBackendExportTask(workspace.recentTask)
      : null,
  tasks: resolveBackendExportTaskList(workspace).map(mapBackendExportTask),
})

export const mapBackendExportDownloadUrl = (input: BackendExportDownloadDTO | string): string => {
  if (typeof input === 'string') {
    return input
  }

  return input.downloadUrl ?? input.resultUrl ?? input.url ?? ''
}
