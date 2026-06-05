import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { EditorDraft } from '@/types/editor'
import { delay, readLocal, writeLocal } from './local'

const EDITOR_KEY = 'amd.editor.drafts'

const getDraftMap = (): Record<string, EditorDraft> => readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})
const setDraftMap = (drafts: Record<string, EditorDraft>): void => writeLocal(EDITOR_KEY, drafts)

const normalizeDraft = (projectId: string, draft?: EditorDraft): EditorDraft => {
  const fallback = createDefaultEditorDraft(projectId)
  if (!draft) {
    return fallback
  }

  return {
    ...fallback,
    ...draft,
    script: {
      ...fallback.script,
      ...draft.script,
    },
  }
}

export const editorApi = {
  async getDraft(projectId: string): Promise<EditorDraft> {
    await delay()
    const drafts = getDraftMap()
    return normalizeDraft(projectId, drafts[projectId])
  },

  async saveDraft(projectId: string, draft: EditorDraft): Promise<EditorDraft> {
    await delay(80)
    if (
      draft.script.content.includes('#mock-save-fail') ||
      draft.script.prompt.includes('#mock-save-fail') ||
      draft.script.generated.includes('#mock-save-fail')
    ) {
      throw new Error('EDITOR_SAVE_FAILED')
    }

    const drafts = getDraftMap()
    const normalized = normalizeDraft(projectId, draft)
    const next = {
      ...normalized,
      script: {
        ...normalized.script,
        updatedAt: new Date().toISOString(),
      },
    }
    drafts[projectId] = next
    setDraftMap(drafts)
    return next
  },
}
