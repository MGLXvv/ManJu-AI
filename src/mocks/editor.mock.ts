import type { EditorDraft } from '@/types/editor'

export const createDefaultEditorDraft = (projectId: string): EditorDraft => ({
  projectId,
  script: {
    content: '',
    updatedAt: new Date().toISOString(),
  },
  characters: [],
  scenes: [],
  shots: [],
})
