import { buildStoryboardExportFileName, buildStoryboardExportPayload } from '@/features/editor/editorArtifactMapper'
import { buildStoryboardDraftShots } from '@/features/editor/editorDraftMapper'
import type { Shot } from '@/types/editor'
import type { StoryboardReferenceImage, StoryboardShot, StoryboardTag, StoryboardTagOptions } from '@/types/storyboard'

export interface StoryboardVideoValidationResult {
  ok: boolean
  message: string
}

type LegacyStoryboardShotStatus = Shot['status'] | 'idle' | 'pending'

type LegacyPersistedStoryboardShot = Omit<Shot, 'status'> & {
  status: LegacyStoryboardShotStatus
}

const cloneReferenceImage = (image: StoryboardReferenceImage): StoryboardReferenceImage => ({ ...image })

const buildTagMap = (items: StoryboardTag[]) => new Map(items.map((item) => [item.id, { ...item }]))

const normalizeLegacyStoryboardStatus = (status: LegacyStoryboardShotStatus): Shot['status'] => {
  if (status === 'idle') return 'pending-review'
  if (status === 'pending') return 'generating'
  return status
}

export { buildStoryboardDraftShots, buildStoryboardExportPayload, buildStoryboardExportFileName }

export const resolveStoryboardShots = (shots: LegacyPersistedStoryboardShot[], options: StoryboardTagOptions): StoryboardShot[] => {
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
    status: normalizeLegacyStoryboardStatus(shot.status),
    isHidden: shot.isHidden ?? false,
    isLocked: shot.isLocked ?? false,
    isFavorite: shot.isFavorite ?? false,
    referenceImages: (shot.referenceImages ?? []).map(cloneReferenceImage),
    createdAt: shot.createdAt ?? '2026年3月12日 17:16',
  }))
}

export const validateStoryboardBeforeVideo = (shots: StoryboardShot[]): StoryboardVideoValidationResult => {
  const visibleShots = shots.filter((shot) => !shot.isHidden)

  if (visibleShots.length === 0) {
    return {
      ok: false,
      message: '请至少保留一个可见分镜后再进入视频生成',
    }
  }

  if (visibleShots.some((shot) => shot.status !== 'success' || !shot.imageUrl)) {
    return {
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
