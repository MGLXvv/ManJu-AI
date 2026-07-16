export const shouldApplyStoryboardAsyncResult = <T extends object>(input: {
  targetProjectId: string | null
  currentProjectId: string | null
  targetShot: T
  currentShot: T | undefined
}): boolean => input.currentProjectId === input.targetProjectId && input.currentShot === input.targetShot
