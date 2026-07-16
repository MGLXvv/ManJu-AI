export const isCompleteExportProjectCurrent = (targetProjectId: string, currentProjectId: string): boolean => {
  return Boolean(targetProjectId) && targetProjectId === currentProjectId
}

export const isCompleteExportDownloadCurrent = (input: {
  targetProjectId: string
  currentProjectId: string
  targetTaskId: string
  currentTaskId?: string
}): boolean => {
  return (
    isCompleteExportProjectCurrent(input.targetProjectId, input.currentProjectId) &&
    Boolean(input.targetTaskId) &&
    input.targetTaskId === input.currentTaskId
  )
}
