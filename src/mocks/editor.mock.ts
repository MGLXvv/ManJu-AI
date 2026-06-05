import type { EditorDraft } from '@/types/editor'

export const createDefaultEditorDraft = (projectId: string): EditorDraft => ({
  projectId,
  script: {
    content: '',
    prompt: '',
    generated: '',
    updatedAt: new Date().toISOString(),
  },
  characters: [],
  scenes: [],
  props: [],
  settingAssets: [],
  shots: [],
})
