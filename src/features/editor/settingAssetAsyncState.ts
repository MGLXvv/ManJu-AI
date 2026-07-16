export const shouldApplySettingAssetAsyncResult = (input: {
  targetProjectId: string
  currentProjectId: string
  currentDraftProjectId?: string
}): boolean => {
  return input.targetProjectId === input.currentProjectId && input.targetProjectId === input.currentDraftProjectId
}
