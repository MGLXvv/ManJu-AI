import { http } from '@/api/http'
import { mapBackendStoryboardWorkspaceToDraftPatch } from '@/api/modules/editor/storyboard.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import type { EditorDraft } from '@/types/editor'

export const storyboardWorkflowService = {
  async generateStoryboard(projectId: string): Promise<Pick<EditorDraft, 'shots'> | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.post(`/aidrama/projects/${projectId}/storyboard/generate`)

    let patch = mapBackendStoryboardWorkspaceToDraftPatch(data)

    if (patch.shots.length === 0) {
      const { data: workspace } = await http.get(`/aidrama/projects/${projectId}/storyboard/workspace`)
      patch = mapBackendStoryboardWorkspaceToDraftPatch(workspace)
    }

    return patch
  },

  async confirmStoryboard(projectId: string): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/projects/${projectId}/storyboard/confirm`)
  },
}
