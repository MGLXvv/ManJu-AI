import { http } from '@/api/http'
import {
  mapBackendExportDownloadUrl,
  mapBackendExportTask,
  mapBackendExportWorkspace,
  type EditorExportTask,
  type EditorExportWorkspace,
} from '@/api/modules/editor/export.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import type {
  BackendExportDownloadDTO,
  BackendExportTaskDTO,
  BackendExportWorkspaceDTO,
} from '@/types/api-dto'

export const exportWorkflowService = {
  async loadExportWorkspace(projectId: string): Promise<EditorExportWorkspace | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.get<BackendExportWorkspaceDTO>(`/aidrama/projects/${projectId}/exports/workspace`)
    return mapBackendExportWorkspace(data)
  },

  async createExportTask(projectId: string): Promise<EditorExportTask | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.post<BackendExportTaskDTO>(`/aidrama/projects/${projectId}/export`)
    return mapBackendExportTask(data)
  },

  async getDownloadUrl(exportTaskId: string): Promise<string> {
    if (isMockMode) {
      return ''
    }

    const { data } = await http.get<BackendExportDownloadDTO | string>(
      `/aidrama/exports/${exportTaskId}/download-url`,
    )
    return mapBackendExportDownloadUrl(data)
  },
}
