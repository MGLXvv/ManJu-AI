import type { EditorDraft, SaveDraftOptions, SaveDraftResult } from '@/types/editor'

export type { EditorDraft, SaveDraftOptions, SaveDraftResult } from '@/types/editor'

export interface EditorApiContract {
  getDraft(projectId: string): Promise<EditorDraft>
  saveDraft(projectId: string, draft: EditorDraft, options?: SaveDraftOptions): Promise<SaveDraftResult>
}
