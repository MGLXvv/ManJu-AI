import { http } from '@/api/http'
import { mapBackendScriptWorkspaceToDraft } from './script.mapper'
import type { EditorApiContract, EditorDraft } from './editor.types'

export const editorHttpApi: EditorApiContract = {
  async getDraft(projectId: string) {
    const { data } = await http.get(`/aidrama/projects/${projectId}/script/workspace`)
    return mapBackendScriptWorkspaceToDraft(projectId, data)
  },

  async saveDraft(projectId: string, draft: EditorDraft) {
    await http.put(`/aidrama/projects/${projectId}/script/draft`, {
      rawText: draft.script.content,
      prompt: draft.script.prompt,
    })

    if (draft.script.generated.trim()) {
      await http.put(`/aidrama/projects/${projectId}/script/content`, {
        content: draft.script.generated,
      })
    }

    const savedAt = new Date().toISOString()

    return {
      draft: {
        ...draft,
        script: {
          ...draft.script,
          updatedAt: savedAt,
        },
      },
      savedAt,
    }
  },
}
