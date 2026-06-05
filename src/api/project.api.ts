import { mockProjects } from '@/mocks/projects.mock'
import type { Project, ProjectStatus, WorkflowStep } from '@/types/project'
import { delay, readLocal, writeLocal } from './local'

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
  favorite?: boolean
}

export interface ImportProjectInput {
  name: string
  ratio: Project['ratio']
  style: string
  status?: ProjectStatus
  currentStep?: WorkflowStep
  duration?: string
  coverUrl?: string
  favorite?: boolean
}

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

export const projectApi = {
  async list(): Promise<Project[]> {
    await delay()
    return getProjects()
  },

  async create(input: CreateProjectInput): Promise<Project> {
    await delay()
    const created = createProjectRecord(input)
    const next = [created, ...getProjects()]
    setProjects(next)
    return created
  },

  async importProjects(inputs: ImportProjectInput[]): Promise<Project[]> {
    await delay(120)
    const imported = inputs.map((item) => createProjectRecord(item))
    setProjects([...imported, ...getProjects()])
    return imported
  },

  async exportProject(id: string): Promise<Project | null> {
    await delay(60)
    return getProjects().find((project) => project.id === id) ?? null
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
