import { createLatestRequestGuard } from '@/features/shared/latestRequestState'

export interface ScriptConfirmationDependencies {
  confirmScript(projectId: string): Promise<void>
  advanceProject(projectId: string): Promise<void>
}

export interface ScriptConfirmationRunner {
  run(projectId: string): Promise<boolean>
  invalidate(): void
}

export const createScriptConfirmationRunner = (
  dependencies: ScriptConfirmationDependencies,
): ScriptConfirmationRunner => {
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

    if (!(await runPhase(() => dependencies.confirmScript(projectId)))) return false
    return runPhase(() => dependencies.advanceProject(projectId))
  }

  return {
    run,
    invalidate: guard.invalidate,
  }
}
