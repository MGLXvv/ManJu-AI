import { createLatestRequestGuard } from '@/features/shared/latestRequestState'

export type ProjectPhase = (projectId: string) => Promise<void>

export interface ProjectPhaseRunner {
  run(projectId: string, phases: ProjectPhase[]): Promise<boolean>
  invalidate(): void
}

export const createProjectPhaseRunner = (): ProjectPhaseRunner => {
  const guard = createLatestRequestGuard()

  const run = async (projectId: string, phases: ProjectPhase[]): Promise<boolean> => {
    if (!projectId) {
      guard.invalidate()
      return false
    }

    const requestId = guard.start()
    for (const phase of phases) {
      try {
        await phase(projectId)
      } catch (error) {
        if (!guard.isCurrent(requestId)) return false
        throw error
      }
      if (!guard.isCurrent(requestId)) return false
    }
    return true
  }

  return {
    run,
    invalidate: guard.invalidate,
  }
}

export const isProjectRouteContextCurrent = (input: {
  targetProjectId: string
  currentProjectId: string
  targetRouteName: unknown
  currentRouteName: unknown
}): boolean => {
  return input.targetProjectId === input.currentProjectId && input.targetRouteName === input.currentRouteName
}
