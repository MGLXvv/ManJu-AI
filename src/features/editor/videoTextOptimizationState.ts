export const shouldApplyVideoTextOptimizationResult = (input: {
  target: {
    projectId: string
    shotId: string
    value: string
  }
  currentProjectId: string
  currentShotId: string | null
  currentValue: string
}): boolean =>
  input.currentProjectId === input.target.projectId &&
  input.currentShotId === input.target.shotId &&
  input.currentValue === input.target.value
