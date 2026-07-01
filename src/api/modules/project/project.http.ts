import { http } from '@/api/http'
import {
  mapBackendProjectListQuery,
  mapBackendProjectToProject,
  mapCreateProjectInputToBackendPayload,
  mapUpdateProjectInputToBackendPayload,
} from './project.mapper'
import type {
  BackendProjectDTO,
  CreateProjectInput,
  ImportProjectInput,
  ProjectApiContract,
  UpdateProjectInput,
} from './project.types'

export const projectHttpApi: ProjectApiContract = {
  async list(query) {
    const { data } = await http.get<{ records?: BackendProjectDTO[] }>('/aidrama/projects', {
      params: mapBackendProjectListQuery(query),
    })
    return (data.records ?? []).map(mapBackendProjectToProject)
  },

  async getById(id) {
    const { data } = await http.get<BackendProjectDTO>(`/aidrama/projects/${id}`)
    return data ? mapBackendProjectToProject(data) : null
  },

  async create(input: CreateProjectInput) {
    const { data } = await http.post<BackendProjectDTO>(
      '/aidrama/projects',
      mapCreateProjectInputToBackendPayload(input),
    )
    return mapBackendProjectToProject(data)
  },

  async importProjects(inputs: ImportProjectInput[]) {
    const { data } = await http.post<{ projects?: BackendProjectDTO[] }>('/projects/import', inputs)
    return (data.projects ?? []).map(mapBackendProjectToProject)
  },

  async exportProject(id: string) {
    const { data } = await http.get<BackendProjectDTO>(`/projects/${id}/export`)
    return data ? mapBackendProjectToProject(data) : null
  },

  async update(input: UpdateProjectInput) {
    const { id } = input
    const payload = mapUpdateProjectInputToBackendPayload(input)

    if (!Object.keys(payload).length) {
      return this.getById(id)
    }

    const { data } = await http.put<BackendProjectDTO>(`/aidrama/projects/${id}`, payload)
    return data ? mapBackendProjectToProject(data) : null
  },

  async remove(id: string) {
    await http.delete(`/aidrama/projects/${id}`)
  },
}