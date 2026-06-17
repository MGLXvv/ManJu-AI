import { mockProjects } from '@/mocks/projects.mock'
import type {
  ProjectCreateRequestDTO,
  ProjectCreateResponseDTO,
  ProjectExportRequestDTO,
  ProjectExportResponseDTO,
  ProjectGetByIdRequestDTO,
  ProjectGetByIdResponseDTO,
  ProjectImportRequestDTO,
  ProjectImportResponseDTO,
  ProjectListRequestDTO,
  ProjectListResponseDTO,
  ProjectRemoveRequestDTO,
  ProjectRemoveResponseDTO,
  ProjectUpdateRequestDTO,
  ProjectUpdateResponseDTO,
} from '@/types/api-dto'
import type { Project } from '@/types/project'
import { delay, readLocal, writeLocal } from '@/api/local'
import type { ImportProjectInput, ProjectApiContract } from './project.types'

const PROJECTS_KEY = 'amd.projects'
const MIN_SEED_COUNT = mockProjects.length

const getProjects = (): Project[] => {
  const stored = readLocal<Project[]>(PROJECTS_KEY, [])
  if (!Array.isArray(stored) || stored.length < 8) {
    return mockProjects
  }

  if (stored.length >= MIN_SEED_COUNT) {
    return stored
  }

  const existingIds = new Set(stored.map((project) => project.id))
  const supplemental = mockProjects.filter((project) => !existingIds.has(project.id))
  return [...stored, ...supplemental].slice(0, MIN_SEED_COUNT)
}

const setProjects = (projects: Project[]): void => writeLocal(PROJECTS_KEY, projects)

const createProjectRecord = (input: ImportProjectInput): Project => {
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name,
    status: input.status ?? 'in_progress',
    currentStep: input.currentStep ?? (input.status === 'completed' ? 'complete' : 'script'),
    ratio: input.ratio,
    style: input.style,
    updatedAt: now,
    duration: input.duration,
    coverUrl: input.coverUrl,
    favorite: input.favorite ?? false,
  }
}

export const projectMockApi: ProjectApiContract = {
  async list(query) {
    await delay()
    const request: ProjectListRequestDTO = query ?? {}
    let projects = getProjects()

    if (request.status && request.status !== 'all') {
      projects = projects.filter((project) => project.status === request.status)
    }

    if (request.keyword?.trim()) {
      const keyword = request.keyword.trim().toLocaleLowerCase()
      projects = projects.filter((project) => project.name.toLocaleLowerCase().includes(keyword))
    }

    const response: ProjectListResponseDTO = { projects }
    return response.projects
  },

  async getById(id) {
    await delay(60)
    const request: ProjectGetByIdRequestDTO = { id }
    const response: ProjectGetByIdResponseDTO = {
      project: getProjects().find((project) => project.id === request.id) ?? null,
    }
    return response.project
  },

  async create(input) {
    await delay()
    const request: ProjectCreateRequestDTO = input
    const created = createProjectRecord(request)
    const next = [created, ...getProjects()]
    setProjects(next)
    const response: ProjectCreateResponseDTO = { project: created }
    return response.project
  },

  async importProjects(inputs) {
    await delay(120)
    const request: ProjectImportRequestDTO = { projects: inputs }
    const imported = request.projects.map((item) => createProjectRecord(item))
    setProjects([...imported, ...getProjects()])
    const response: ProjectImportResponseDTO = { projects: imported }
    return response.projects
  },

  async exportProject(id) {
    await delay(60)
    const request: ProjectExportRequestDTO = { id }
    const response: ProjectExportResponseDTO = {
      project: getProjects().find((project) => project.id === request.id) ?? null,
    }
    return response.project
  },

  async update(input) {
    await delay()
    const request: ProjectUpdateRequestDTO = input
    const projects = getProjects()
    const index = projects.findIndex((project) => project.id === request.id)
    if (index < 0) {
      return null
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    const merged: Project = {
      ...projects[index],
      ...request,
      updatedAt: now,
    }
    projects[index] = merged
    setProjects(projects)
    const response: ProjectUpdateResponseDTO = { project: merged }
    return response.project
  },

  async remove(id) {
    await delay(80)
    const request: ProjectRemoveRequestDTO = { id }
    setProjects(getProjects().filter((project) => project.id !== request.id))
    const response: ProjectRemoveResponseDTO = { removed: true }
    void response
  },
}
