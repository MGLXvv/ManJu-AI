import type { BackendStoryboardDTO, BackendStoryboardWorkspaceDTO } from '@/types/api-dto'
import type { EditorDraft, Shot } from '@/types/editor'
import type { StoryboardShot } from '@/types/storyboard'

export interface BackendStoryboardSavePayload {
  title: string
  content: string
  durationSeconds: number
}

export const resolveBackendStoryboardList = (
  workspace: BackendStoryboardWorkspaceDTO,
): BackendStoryboardDTO[] => workspace.storyboards ?? workspace.list ?? []

export const isLocalStoryboardShotId = (id: string): boolean => id.startsWith('shot-')

export const mapShotToBackendStoryboardPayload = (
  shot: StoryboardShot,
): BackendStoryboardSavePayload => ({
  title: shot.title,
  content: shot.prompt || '',
  durationSeconds: shot.durationSeconds ?? 5,
})

export const mapBackendStoryboardToShot = (
  item: BackendStoryboardDTO,
  fallbackIndex: number,
): Shot => {
  const index = Number(item.index ?? item.sort ?? item.sortOrder ?? fallbackIndex)

  return {
    id: String(item.id),
    index,
    title: item.title || `镜头 ${index}`,
    description: item.content || item.description || item.prompt || '',
    characterIds: [],
    sceneIds: [],
    propIds: [],
    imageUrl: item.imageUrl || '',
    videoUrl: item.videoUrl || '',
    videoPrompt: '',
    dialogue: '',
    durationSeconds: item.durationSeconds ?? 5,
    voiceAssignments: [],
    status: 'pending-review',
    style: 'anime',
    ratio: '16:9',
    isHidden: false,
    isLocked: false,
    isFavorite: false,
    referenceImages: [],
    editHistory: [],
    createdAt: item.createTime || item.updateTime || '',
  }
}

export const mapBackendStoryboardWorkspaceToDraftPatch = (
  workspace: BackendStoryboardWorkspaceDTO,
): Pick<EditorDraft, 'shots'> => ({
  shots: resolveBackendStoryboardList(workspace).map((item, index) =>
    mapBackendStoryboardToShot(item, index + 1),
  ),
})
