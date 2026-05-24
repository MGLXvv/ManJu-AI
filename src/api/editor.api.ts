import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { EditorDraft } from '@/types/editor'
import { delay, readLocal, writeLocal } from './local'

const EDITOR_KEY = 'amd.editor.drafts'

const getDraftMap = (): Record<string, EditorDraft> => readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})
const setDraftMap = (drafts: Record<string, EditorDraft>): void => writeLocal(EDITOR_KEY, drafts)

export const editorApi = {
  async getDraft(projectId: string): Promise<EditorDraft> {
    await delay()
    const drafts = getDraftMap()
    return drafts[projectId] ?? createDefaultEditorDraft(projectId)
  },

  async saveDraft(projectId: string, draft: EditorDraft): Promise<EditorDraft> {
    await delay(80)
    const drafts = getDraftMap()
    const next = {
      ...draft,
      script: {
        ...draft.script,
        updatedAt: new Date().toISOString(),
      },
    }
    drafts[projectId] = next
    setDraftMap(drafts)
    return next
  },
}
