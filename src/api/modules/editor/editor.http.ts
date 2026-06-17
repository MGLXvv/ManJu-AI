import { http } from '@/api/http'
import type { EditorApiContract, EditorDraft } from './editor.types'

export const editorHttpApi: EditorApiContract = {
  async getDraft(projectId: string) {
    const { data } = await http.get(`/editor/drafts/${projectId}`)
    return data.draft
  },

  async saveDraft(projectId: string, draft: EditorDraft) {
    const { data } = await http.put(`/editor/drafts/${projectId}`, { draft })
    return data
  },
}
