import type { EditorDraft, EditorPersistencePartition, SaveDraftOptions, SaveDraftResult } from '@/types/editor'

export type { EditorDraft, SaveDraftOptions, SaveDraftResult } from '@/types/editor'

export interface EditorLoadDraftOptions {
  partitions?: EditorPersistencePartition[]
}

export interface EditorApiContract {
  getDraft(projectId: string, options?: EditorLoadDraftOptions): Promise<EditorDraft>
  saveDraft(projectId: string, draft: EditorDraft, options?: SaveDraftOptions): Promise<SaveDraftResult>
}
