export interface ScriptDraftFields {
  sourceText: string
  promptText: string
  generatedScript: string
}

export const buildScriptDraftSnapshot = (fields: ScriptDraftFields): string => {
  return JSON.stringify(fields)
}

export const hasUnsavedScriptChanges = (lastSavedSnapshot: string, fields: ScriptDraftFields): boolean => {
  return lastSavedSnapshot !== buildScriptDraftSnapshot(fields)
}

export const clearScriptPromptFields = (fields: ScriptDraftFields): ScriptDraftFields => ({
  ...fields,
  promptText: '',
})
