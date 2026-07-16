export const shouldApplyEditorSaveResult = (input: {
  targetProjectId: string
  currentProjectId: string | null
  currentDraftProjectId?: string
}): boolean => {
  return input.targetProjectId === input.currentProjectId && input.targetProjectId === input.currentDraftProjectId
}
