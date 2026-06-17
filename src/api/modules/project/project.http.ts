import { http } from '@/api/http'
import type { CreateProjectInput, ImportProjectInput, ProjectApiContract, UpdateProjectInput } from './project.types'

export const projectHttpApi: ProjectApiContract = {
  async list(query) {
    const { data } = await http.get('/projects', { params: query })
    return data.projects
  },

  async getById(id) {
    const { data } = await http.get(`/projects/${id}`)
    return data.project
  },

  async create(input: CreateProjectInput) {
    const { data } = await http.post('/projects', input)
    return data.project
  },

  async importProjects(inputs: ImportProjectInput[]) {
    const { data } = await http.post('/projects/import', { projects: inputs })
    return data.projects
  },

  async exportProject(id: string) {
    const { data } = await http.get(`/projects/${id}/export`)
    return data.project
  },

  async update(input: UpdateProjectInput) {
    const { id, ...payload } = input
    const { data } = await http.patch(`/projects/${id}`, payload)
    return data.project
  },

  async remove(id: string) {
    await http.delete(`/projects/${id}`)
  },
}
