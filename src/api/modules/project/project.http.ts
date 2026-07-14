import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { API_ERROR_CODES } from '@/types/api-enums'
import {
  mapBackendProjectListQuery,
  mapBackendProjectToProject,
  mapCreateProjectInputToBackendPayload,
  mapUpdateProjectInputToBackendPayload,
} from './project.mapper'
import type {
  BackendProjectDTO,
  BackendProjectPageDTO,
  CreateProjectInput,
  ImportProjectInput,
  ProjectApiContract,
  UpdateProjectInput,
} from './project.types'

const PROJECTS_PATH = '/aidrama/projects'

export const projectHttpApi: ProjectApiContract = {
  async list(query) {
    const { data } = await http.get<BackendProjectPageDTO>(PROJECTS_PATH, {
      params: mapBackendProjectListQuery(query),
    })
    return (data.list ?? []).map(mapBackendProjectToProject)
  },

  async getById(id) {
    const { data } = await http.get<BackendProjectDTO>(`${PROJECTS_PATH}/${id}`)
    return data ? mapBackendProjectToProject(data) : null
  },

  async create(input: CreateProjectInput) {
    const { data } = await http.post<BackendProjectDTO>(PROJECTS_PATH, mapCreateProjectInputToBackendPayload(input))
    return mapBackendProjectToProject(data)
  },

  async importProjects(_inputs: ImportProjectInput[]) {
    throw createApiError({
      code: API_ERROR_CODES.projectImportControlledReject,
      message: 'Project import is a Phase1 controlled-reject capability.',
      details: { endpoint: 'POST /projects/import' },
    })
  },

  async exportProject(_id: string) {
    throw createApiError({
      code: API_ERROR_CODES.projectExportContractMismatch,
      message: 'Project JSON export must not map the backend export-task response to a Project entity.',
      details: {
        compatEndpoint: 'GET /projects/{projectId}/export',
        workflowService: 'exportWorkflowService',
      },
    })
  },

  async update(input: UpdateProjectInput) {
    const { id } = input
    const payload = mapUpdateProjectInputToBackendPayload(input)

    if (!Object.keys(payload).length) {
      return this.getById(id)
    }

    const { data } = await http.put<BackendProjectDTO>(`${PROJECTS_PATH}/${id}`, payload)
    return data ? mapBackendProjectToProject(data) : null
  },

  async remove(id: string) {
    await http.delete(`${PROJECTS_PATH}/${id}`)
  },
}
