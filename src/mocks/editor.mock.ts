import type { EditorDraft } from '@/types/editor'

export const createDefaultEditorDraft = (projectId: string): EditorDraft => ({
  projectId,
  revision: 0,
  script: {
    content: '',
    prompt: '',
    outline: '',
    generated: '',
    storyboard: '',
    updatedAt: new Date().toISOString(),
  },
  characters: [],
  scenes: [],
  props: [],
  settingAssets: [],
  storyboardGenerationMode: null,
  shots: [],
  dubbing: {
    modelId: 'index-tts',
    cards: [],
  },
})
