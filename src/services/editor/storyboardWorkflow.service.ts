import { http } from '@/api/http'
import {
  isLocalStoryboardShotId,
  mapBackendStoryboardWorkspaceToDraftPatch,
  mapShotToBackendStoryboardPayload,
} from '@/api/modules/editor/storyboard.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import type { EditorDraft } from '@/types/editor'
import type { StoryboardShot } from '@/types/storyboard'

export const storyboardWorkflowService = {
  async loadStoryboardWorkspace(projectId: string): Promise<Pick<EditorDraft, 'shots'> | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.get(`/aidrama/projects/${projectId}/storyboard/workspace`)
    return mapBackendStoryboardWorkspaceToDraftPatch(data)
  },

  async generateStoryboard(projectId: string): Promise<Pick<EditorDraft, 'shots'> | null> {
    if (isMockMode) {
      return null
    }

    const { data } = await http.post(`/aidrama/projects/${projectId}/storyboard/generate`)

    let patch = mapBackendStoryboardWorkspaceToDraftPatch(data)

    if (patch.shots.length === 0) {
      patch = (await this.loadStoryboardWorkspace(projectId)) ?? { shots: [] }
    }

    return patch
  },

  async createStoryboard(projectId: string, shot: StoryboardShot): Promise<void> {
    await http.post(
      `/aidrama/projects/${projectId}/storyboards`,
      mapShotToBackendStoryboardPayload(shot),
    )
  },

  async updateStoryboard(projectId: string, shot: StoryboardShot): Promise<void> {
    await http.put(
      `/aidrama/projects/${projectId}/storyboards/${shot.id}`,
      mapShotToBackendStoryboardPayload(shot),
    )
  },

  async deleteStoryboard(projectId: string, storyboardId: string): Promise<void> {
    await http.delete(`/aidrama/projects/${projectId}/storyboards/${storyboardId}`)
  },

  async syncStoryboards(
    projectId: string,
    input: {
      currentShots: StoryboardShot[]
      persistedIds: string[]
    },
  ): Promise<Pick<EditorDraft, 'shots'> | null> {
    if (isMockMode) {
      return null
    }

    const currentPersistedIds = new Set(
      input.currentShots
        .map((shot) => shot.id)
        .filter((id) => !isLocalStoryboardShotId(id)),
    )

    const deletedIds = input.persistedIds.filter((id) => !currentPersistedIds.has(id))

    for (const id of deletedIds) {
      await this.deleteStoryboard(projectId, id)
    }

    for (const shot of input.currentShots) {
      if (isLocalStoryboardShotId(shot.id)) {
        await this.createStoryboard(projectId, shot)
        continue
      }

      await this.updateStoryboard(projectId, shot)
    }

    return this.loadStoryboardWorkspace(projectId)
  },

  async confirmStoryboard(projectId: string): Promise<void> {
    if (isMockMode) {
      return
    }

    await http.post(`/aidrama/projects/${projectId}/storyboard/confirm`)
  },
}
