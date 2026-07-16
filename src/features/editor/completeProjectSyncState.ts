import { createLatestRequestGuard } from '@/features/shared/latestRequestState'

export interface CompleteProjectSyncDependencies {
  loadDraft(projectId: string): Promise<void>
  ensureProjectsLoaded(): Promise<void>
  markProjectComplete(projectId: string): Promise<void>
  refreshExportWorkspace(projectId: string): Promise<void>
}

export interface CompleteProjectSyncRunner {
  run(projectId: string): Promise<boolean>
  invalidate(): void
}

export const createCompleteProjectSyncRunner = (
  dependencies: CompleteProjectSyncDependencies,
): CompleteProjectSyncRunner => {
  const guard = createLatestRequestGuard()

  const run = async (projectId: string): Promise<boolean> => {
    if (!projectId) {
      guard.invalidate()
      return false
    }

    const requestId = guard.start()
    const runPhase = async (phase: () => Promise<void>): Promise<boolean> => {
      try {
        await phase()
      } catch (error) {
        if (!guard.isCurrent(requestId)) return false
        throw error
      }
      return guard.isCurrent(requestId)
    }

    if (!(await runPhase(() => dependencies.loadDraft(projectId)))) return false
    if (!(await runPhase(() => dependencies.ensureProjectsLoaded()))) return false
    if (!(await runPhase(() => dependencies.markProjectComplete(projectId)))) return false
    return runPhase(() => dependencies.refreshExportWorkspace(projectId))
  }

  return {
    run,
    invalidate: guard.invalidate,
  }
}
