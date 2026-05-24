import { mockProjects } from '@/mocks/projects.mock'
import type { Project, ProjectStatus, WorkflowStep } from '@/types/project'
import { delay, readLocal, writeLocal } from './local'

const PROJECTS_KEY = 'amd.projects'

const getProjects = (): Project[] => {
  const stored = readLocal<Project[]>(PROJECTS_KEY, [])
  if (!Array.isArray(stored) || stored.length < 8) {
    return mockProjects
  }
  return stored
}
const setProjects = (projects: Project[]): void => writeLocal(PROJECTS_KEY, projects)

export interface CreateProjectInput {
  name: string
  ratio: Project['ratio']
  style: string
}

export interface UpdateProjectInput {
  id: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  name?: string
}

export const projectApi = {
  async list(): Promise<Project[]> {
    await delay()
    return getProjects()
  },

  async create(input: CreateProjectInput): Promise<Project> {
    await delay()
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    const created: Project = {
      id: `project-${Date.now()}`,
      name: input.name,
      status: 'in_progress',
      currentStep: 'script',
      ratio: input.ratio,
      style: input.style,
      updatedAt: now,
    }
    const next = [created, ...getProjects()]
    setProjects(next)
    return created
  },

  async update(input: UpdateProjectInput): Promise<Project | null> {
    await delay()
    const projects = getProjects()
    const index = projects.findIndex((project) => project.id === input.id)
    if (index < 0) {
      return null
    }

    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    const merged: Project = {
      ...projects[index],
      ...input,
      updatedAt: now,
    }
    projects[index] = merged
    setProjects(projects)
    return merged
  },

  async remove(id: string): Promise<void> {
    await delay(80)
    setProjects(getProjects().filter((project) => project.id !== id))
  },
}
