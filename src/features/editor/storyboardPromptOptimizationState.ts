interface StoryboardPromptTarget {
  projectId: string
  prompt: string
}

export const shouldApplyActiveStoryboardPromptResult = (input: {
  target: StoryboardPromptTarget & { shotId: string }
  currentProjectId: string
  currentShot: { id: string; prompt: string } | null
}): boolean =>
  input.currentProjectId === input.target.projectId &&
  input.currentShot?.id === input.target.shotId &&
  input.currentShot.prompt === input.target.prompt

export const shouldApplyInsertStoryboardPromptResult = (input: {
  target: StoryboardPromptTarget & { insertAfterShotId: string }
  currentProjectId: string
  currentInsertAfterShotId: string | null
  currentPrompt: string
}): boolean =>
  input.currentProjectId === input.target.projectId &&
  input.currentInsertAfterShotId === input.target.insertAfterShotId &&
  input.currentPrompt === input.target.prompt
