import { buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import type { Shot } from '@/types/editor'
import type { StoryboardReferenceImage, StoryboardShot, StoryboardTag, StoryboardTagOptions } from '@/types/storyboard'

export interface StoryboardVideoValidationResult {
  ok: boolean
  message: string
}

export interface ExportedStoryboardPayload {
  exportedAt: string
  shots: Shot[]
}

const cloneReferenceImage = (image: StoryboardReferenceImage): StoryboardReferenceImage => ({ ...image })

const buildTagMap = (items: StoryboardTag[]) => new Map(items.map((item) => [item.id, { ...item }]))

export const buildStoryboardDraftShots = (shots: StoryboardShot[]): Shot[] =>
  shots.map((shot) => ({
    id: shot.id,
    index: shot.index,
    title: shot.title,
    description: shot.prompt,
    characterIds: shot.characters.map((item) => item.id),
    sceneIds: shot.scenes.map((item) => item.id),
    propIds: shot.props.map((item) => item.id),
    imageUrl: shot.imageUrl,
    videoUrl: shot.videoUrl,
    videoPrompt: shot.videoPrompt,
    dialogue: shot.dialogue,
    durationSeconds: shot.durationSeconds,
    voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
    status: shot.status,
    style: shot.style,
    ratio: shot.ratio,
    isLocked: shot.isLocked ?? false,
    isFavorite: shot.isFavorite ?? false,
    referenceImages: shot.referenceImages.map(cloneReferenceImage),
    createdAt: shot.createdAt ?? '2026年3月12日 17:16',
  }))

export const resolveStoryboardShots = (shots: Shot[], options: StoryboardTagOptions): StoryboardShot[] => {
  const characterMap = buildTagMap(options.characters)
  const sceneMap = buildTagMap(options.scenes)
  const propMap = buildTagMap(options.props)

  return shots.map((shot) => ({
    id: shot.id,
    index: shot.index,
    title: shot.title,
    imageUrl: shot.imageUrl,
    videoUrl: shot.videoUrl,
    prompt: shot.description,
    videoPrompt: shot.videoPrompt ?? shot.description,
    dialogue: shot.dialogue ?? '',
    durationSeconds: shot.durationSeconds ?? 10,
    voiceAssignments: (shot.voiceAssignments ?? []).map((item) => ({ ...item })),
    characters: shot.characterIds.map((id) => characterMap.get(id)).filter(Boolean) as StoryboardTag[],
    scenes: shot.sceneIds.map((id) => sceneMap.get(id)).filter(Boolean) as StoryboardTag[],
    props: shot.propIds.map((id) => propMap.get(id)).filter(Boolean) as StoryboardTag[],
    style: shot.style ?? '国风漫画',
    ratio: shot.ratio ?? '16:9',
    status: shot.status,
    isLocked: shot.isLocked ?? false,
    isFavorite: shot.isFavorite ?? false,
    referenceImages: (shot.referenceImages ?? []).map(cloneReferenceImage),
    createdAt: shot.createdAt ?? '2026年3月12日 17:16',
  }))
}

export const buildStoryboardExportPayload = (shots: StoryboardShot[]): ExportedStoryboardPayload => ({
  exportedAt: new Date().toISOString(),
  shots: buildStoryboardDraftShots(shots),
})

export const buildStoryboardExportFileName = (projectId: string): string => {
  return buildProjectArtifactFileName(projectId || 'storyboard', 'storyboard')
}

export const validateStoryboardBeforeVideo = (shots: StoryboardShot[]): StoryboardVideoValidationResult => {
  const hasGeneratedShot = shots.some((shot) => shot.status === 'success' && Boolean(shot.imageUrl))

  if (!hasGeneratedShot) {
    return {
      ok: false,
      message: '请至少生成一个分镜镜头后再进入视频生成',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
