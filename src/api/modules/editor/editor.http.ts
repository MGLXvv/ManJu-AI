import { http } from '@/api/http'
import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import { mapBackendScriptWorkspaceToDraft } from './script.mapper'
import { mapBackendStoryboardWorkspaceToDraftPatch } from './storyboard.mapper'
import type { EditorApiContract, EditorDraft } from './editor.types'

export const editorHttpApi: EditorApiContract = {
  async getDraft(projectId: string) {
    const { data: scriptWorkspace } = await http.get(`/aidrama/projects/${projectId}/script/workspace`)

    let storyboardPatch: Pick<EditorDraft, 'shots'> = { shots: [] }

    try {
      const { data: storyboardWorkspace } = await http.get(
        `/aidrama/projects/${projectId}/storyboard/workspace`,
      )
      storyboardPatch = mapBackendStoryboardWorkspaceToDraftPatch(storyboardWorkspace)
    } catch {
      storyboardPatch = { shots: [] }
    }

    const scriptDraft = mapBackendScriptWorkspaceToDraft(projectId, scriptWorkspace)

    return normalizeEditorDraft(projectId, {
      ...scriptDraft,
      ...storyboardPatch,
    })
  },

  async saveDraft(projectId: string, draft: EditorDraft, options = {}) {
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
    const revision = (options.expectedRevision ?? draft.revision ?? 0) + 1

    return {
      draft: {
        ...draft,
        revision,
        script: {
          ...draft.script,
          updatedAt: savedAt,
        },
      },
      savedAt,
      revision,
    }
  },
}
