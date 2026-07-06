import { buildStoryboardExportFileName, buildStoryboardExportPayload } from '@/features/editor/editorArtifactMapper'
import { buildStoryboardDraftShots } from '@/features/editor/editorDraftMapper'
import { validateMultiParamShotsBeforeVideo } from '@/features/editor/storyboardParameterValidationState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import type { Shot } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import type {
  StoryboardImageEditRecord,
  StoryboardReferenceImage,
  StoryboardShot,
  StoryboardTag,
  StoryboardTagOptions,
} from '@/types/storyboard'

export interface StoryboardVideoValidationResult {
  ok: boolean
  message: string
}

type LegacyStoryboardShotStatus = Shot['status'] | 'idle' | 'pending'

type LegacyPersistedStoryboardShot = Omit<Shot, 'status'> & {
  status: LegacyStoryboardShotStatus
  isFavorite?: boolean
}

const cloneReferenceImage = (image: StoryboardReferenceImage): StoryboardReferenceImage => ({ ...image })
const cloneEditRecord = (record: StoryboardImageEditRecord): StoryboardImageEditRecord => ({
  ...record,
  selection: { ...record.selection },
})

const buildTagMap = (items: StoryboardTag[]) => new Map(items.map((item) => [item.id, { ...item }]))

const normalizeLegacyStoryboardStatus = (status: LegacyStoryboardShotStatus): Shot['status'] => {
  if (status === 'idle') return 'pending-review'
  if (status === 'pending') return 'generating'
  return status
}

const resolveCharacterVoiceId = (asset: SettingAsset): string =>
  asset.voiceId?.trim() || asset.selectedVoiceId?.trim() || asset.voiceOptions?.[0]?.id || ''

const resolveCharacterVoiceName = (asset: SettingAsset): string => {
  const directVoiceName = asset.voiceName?.trim()
  if (directVoiceName) {
    return directVoiceName
  }

  const selectedVoiceId = resolveCharacterVoiceId(asset)
  if (selectedVoiceId) {
    const selectedVoice = asset.voiceOptions?.find((option) => option.id === selectedVoiceId)
    const selectedVoiceName = selectedVoice?.name.trim()
    if (selectedVoiceName) {
      return selectedVoiceName
    }
  }

  return asset.voiceOptions?.[0]?.name.trim() || ''
}

const buildCharacterVoiceMap = (settingAssets: SettingAsset[]): Map<string, { voiceId?: string; voiceName: string }> =>
  new Map(
    settingAssets
      .filter((asset) => asset.type === 'character')
      .map((asset) => [
        asset.id,
        {
          voiceId: resolveCharacterVoiceId(asset) || undefined,
          voiceName: resolveCharacterVoiceName(asset),
        },
      ] as const)
      .filter((entry) => Boolean(entry[1].voiceName)),
  )

export { buildStoryboardDraftShots, buildStoryboardExportPayload, buildStoryboardExportFileName }

export const resolveStoryboardShots = (
  shots: LegacyPersistedStoryboardShot[],
  options: StoryboardTagOptions,
  settingAssets: SettingAsset[] = [],
): StoryboardShot[] => {
  const characterMap = buildTagMap(options.characters)
  const sceneMap = buildTagMap(options.scenes)
  const propMap = buildTagMap(options.props)
  const characterVoiceMap = buildCharacterVoiceMap(settingAssets)

  return shots.map((shot) => {
    const existingVoiceAssignments = (shot.voiceAssignments ?? []).map((item) => ({ ...item }))
    const voiceAssignments =
      existingVoiceAssignments.length > 0
        ? existingVoiceAssignments
        : shot.characterIds
            .map((characterId, index) => {
              const selection = characterVoiceMap.get(characterId)
              if (!selection) {
                return null
              }

              return {
                id: `voice-${shot.id}-${index + 1}`,
                characterId,
                voiceId: selection.voiceId,
                voiceName: selection.voiceName,
                voice: selection.voiceName,
              }
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))

    return {
      id: shot.id,
      index: shot.index,
      title: shot.title,
      imageUrl: shot.imageUrl,
      videoUrl: shot.videoUrl,
      prompt: shot.description,
      videoPrompt: shot.videoPrompt ?? shot.description,
      dialogue: shot.dialogue ?? '',
      durationSeconds: shot.durationSeconds ?? 10,
      voiceAssignments,
      characters: shot.characterIds.map((id) => characterMap.get(id)).filter(Boolean) as StoryboardTag[],
      scenes: shot.sceneIds.map((id) => sceneMap.get(id)).filter(Boolean) as StoryboardTag[],
      props: shot.propIds.map((id) => propMap.get(id)).filter(Boolean) as StoryboardTag[],
      style: shot.style ?? '国风漫画',
      ratio: shot.ratio ?? '16:9',
      status: normalizeLegacyStoryboardStatus(shot.status),
      isHidden: shot.isHidden ?? false,
      isLocked: shot.isLocked ?? false,
      storyboardReviewed: shot.storyboardReviewed ?? shot.isFavorite ?? false,
      videoReviewed: shot.videoReviewed ?? false,
      referenceImages: (shot.referenceImages ?? []).map(cloneReferenceImage),
      editHistory: (shot.editHistory ?? []).map(cloneEditRecord),
      createdAt: shot.createdAt ?? '2026年3月12日 17:16',
    }
  })
}

export const validateStoryboardBeforeVideo = (
  shots: StoryboardShot[],
  mode: StoryboardMode,
): StoryboardVideoValidationResult => {
  const visibleShots = shots.filter((shot) => !shot.isHidden)

  if (!mode) {
    return {
      ok: false,
      message: '请先选择分镜生成模式',
    }
  }

  if (visibleShots.length === 0) {
    return {
      ok: false,
      message: '请至少保留一个可见分镜后再进入视频生成',
    }
  }

  if (mode === 'image' && visibleShots.some((shot) => shot.status !== 'success' || !shot.imageUrl)) {
    return {
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    }
  }

  if (mode === 'multi-param') {
    const result = validateMultiParamShotsBeforeVideo(visibleShots)
    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
      }
    }
  }

  if (visibleShots.some((shot) => !(shot.storyboardReviewed ?? shot.isFavorite))) {
    return {
      ok: false,
      message: '请先完成人工审核并标记所有可见分镜后再进入视频生成',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
