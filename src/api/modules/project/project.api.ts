import { isMockMode } from '@/api/shared/apiMode'
import { requireCapability } from '@/features/capabilities/capabilityRegistry'
import { projectHttpApi } from './project.http'
import { projectMockApi } from './project.mock'
import type { ProjectApiContract } from './project.types'

const implementation = isMockMode ? projectMockApi : projectHttpApi

export const projectApi: ProjectApiContract = {
  list: (query) => implementation.list(query),
  getById: (id) => implementation.getById(id),
  create: (input) => implementation.create(input),
  importProjects: (inputs) => {
    requireCapability('project.import')
    return implementation.importProjects(inputs)
  },
  exportProject: (id) => {
    requireCapability('project.export')
    return implementation.exportProject(id)
  },
  update: (input) => implementation.update(input),
  remove: (id) => implementation.remove(id),
}
