import type { EditorDraft, SaveDraftResult } from '@/types/editor'

export type { EditorDraft, SaveDraftResult } from '@/types/editor'

export interface EditorApiContract {
  getDraft(projectId: string): Promise<EditorDraft>
  saveDraft(projectId: string, draft: EditorDraft): Promise<SaveDraftResult>
}
