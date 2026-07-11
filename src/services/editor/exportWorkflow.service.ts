import { http } from '@/api/http'
import {
  mapBackendExportDownloadUrl,
  mapBackendExportTask,
  mapBackendExportWorkspace,
  type EditorExportTask,
  type EditorExportWorkspace,
} from '@/api/modules/editor/export.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import { canUseCapability, requireCapability } from '@/features/capabilities/capabilityRegistry'
import type {
  BackendExportDownloadDTO,
  BackendExportTaskDTO,
  BackendExportWorkspaceDTO,
} from '@/types/api-dto'

export const exportWorkflowService = {
  async loadExportWorkspace(projectId: string): Promise<EditorExportWorkspace | null> {
    if (isMockMode || !canUseCapability('export.task')) {
      return null
    }

    const { data } = await http.get<BackendExportWorkspaceDTO>(`/aidrama/projects/${projectId}/exports/workspace`)
    return mapBackendExportWorkspace(data)
  },

  async createExportTask(projectId: string): Promise<EditorExportTask | null> {
    requireCapability('export.task')
    const { data } = await http.post<BackendExportTaskDTO>(`/aidrama/projects/${projectId}/export`)
    return mapBackendExportTask(data)
  },

  async getDownloadUrl(exportTaskId: string): Promise<string> {
    requireCapability('export.task')
    const { data } = await http.get<BackendExportDownloadDTO | string>(
      `/aidrama/exports/${exportTaskId}/download-url`,
    )
    return mapBackendExportDownloadUrl(data)
  },
}
