import { http } from '@/api/http'
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

  async importProjects(inputs: ImportProjectInput[]) {
    const { data } = await http.post<{ projects?: BackendProjectDTO[] }>(`${PROJECTS_PATH}/import`, inputs)
    return (data.projects ?? []).map(mapBackendProjectToProject)
  },

  async exportProject(id: string) {
    const { data } = await http.get<BackendProjectDTO>(`${PROJECTS_PATH}/${id}/export`)
    return data ? mapBackendProjectToProject(data) : null
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
