import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { DubbingDraft, DubbingRoleCardDraft, DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import type { EditorDraft, PropSetting, ScriptDraft, Shot } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardImageEditRecord, StoryboardReferenceImage, StoryboardShot } from '@/types/storyboard'

const DEFAULT_MODEL_ID = 'index-tts'

const cloneReferenceImage = (image: StoryboardReferenceImage): StoryboardReferenceImage => ({ ...image })
const cloneEditRecord = (record: StoryboardImageEditRecord): StoryboardImageEditRecord => ({
  ...record,
  selection: { ...record.selection },
})

const cloneLine = (line: DubbingRoleLineDraft): DubbingRoleLineDraft => ({ ...line })

const cloneVoiceOptions = (asset: SettingAsset): SettingAsset['voiceOptions'] =>
  asset.voiceOptions?.map((option) => ({ ...option }))

const cloneAudio = (asset: SettingAsset): SettingAsset['audio'] =>
  asset.audio
    ? {
        ...asset.audio,
        waveform: asset.audio.waveform ? [...asset.audio.waveform] : undefined,
      }
    : undefined

export const cloneSettingAssetDraft = (asset: SettingAsset): SettingAsset => ({
  ...asset,
  imageUrls: [...asset.imageUrls],
  candidateImages: asset.candidateImages ? [...asset.candidateImages] : undefined,
  voiceOptions: cloneVoiceOptions(asset),
  audio: cloneAudio(asset),
})

export const cloneScriptDraft = (script: ScriptDraft): ScriptDraft => ({
  ...script,
})

export const cloneShotDraft = (shot: Shot): Shot => ({
  ...shot,
  characterIds: [...shot.characterIds],
  sceneIds: [...shot.sceneIds],
  propIds: [...shot.propIds],
  voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
  referenceImages: shot.referenceImages?.map(cloneReferenceImage) ?? [],
  editHistory: shot.editHistory?.map(cloneEditRecord) ?? [],
})

export const cloneDubbingDraft = (dubbing: DubbingDraft): DubbingDraft => ({
  ...dubbing,
  cards: dubbing.cards.map((card) => ({
    ...card,
    lines: card.lines.map(cloneLine),
  })),
})

const buildSummary = (assets: SettingAsset[], type: SettingAsset['type']): PropSetting[] =>
  assets
    .filter((asset) => asset.type === type)
    .map((asset) => ({
      id: asset.id,
      name: asset.title,
      description: asset.description || asset.prompt,
    }))

export const buildScriptDraftPatch = (
  current: ScriptDraft,
  patch: Partial<Pick<ScriptDraft, 'content' | 'prompt' | 'outline' | 'generated' | 'storyboard' | 'updatedAt'>>,
): Pick<EditorDraft, 'script'> => ({
  script: {
    ...cloneScriptDraft(current),
    ...patch,
  },
})

export const buildSettingDraftPatch = (
  assets: SettingAsset[],
): Pick<EditorDraft, 'settingAssets' | 'characters' | 'scenes' | 'props'> => {
  const clonedAssets = assets.map(cloneSettingAssetDraft)
  return {
    settingAssets: clonedAssets,
    characters: buildSummary(clonedAssets, 'character'),
    scenes: buildSummary(clonedAssets, 'scene'),
    props: buildSummary(clonedAssets, 'prop'),
  }
}

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
    isHidden: shot.isHidden ?? false,
    isLocked: shot.isLocked ?? false,
    storyboardReviewed: shot.storyboardReviewed ?? false,
    videoReviewed: shot.videoReviewed ?? false,
    referenceImages: shot.referenceImages.map(cloneReferenceImage),
    editHistory: shot.editHistory?.map(cloneEditRecord) ?? [],
    createdAt: shot.createdAt ?? '2026年03月12日 17:16',
  }))

export const buildStoryboardDraftPatch = (shots: StoryboardShot[]): Pick<EditorDraft, 'shots'> => ({
  shots: buildStoryboardDraftShots(shots),
})

export const buildDubbingDraftPatch = (input: { modelId: string; cards: DubbingRoleCardModel[] }): { dubbing: DubbingDraft } => ({
  dubbing: {
    modelId: input.modelId || DEFAULT_MODEL_ID,
    cards: input.cards.map<DubbingRoleCardDraft>((card) => ({
      id: card.id,
      selectedVoiceId: card.selectedVoiceId,
      hidden: card.hidden,
      lines: card.lines.map(cloneLine),
    })),
  },
})

export const normalizeEditorDraft = (projectId: string, draft?: EditorDraft): EditorDraft => {
  const fallback = createDefaultEditorDraft(projectId)
  if (!draft) {
    return fallback
  }

  const nextSettingAssets = draft.settingAssets?.length ? draft.settingAssets : fallback.settingAssets
  const nextShots = draft.shots?.length ? draft.shots : fallback.shots

  return {
    ...fallback,
    ...draft,
    script: {
      ...fallback.script,
      ...cloneScriptDraft(draft.script ?? fallback.script),
    },
    settingAssets: nextSettingAssets.map(cloneSettingAssetDraft),
    characters: (draft.characters?.length ? draft.characters : fallback.characters).map((item) => ({ ...item })),
    scenes: (draft.scenes?.length ? draft.scenes : fallback.scenes).map((item) => ({ ...item })),
    props: (draft.props?.length ? draft.props : fallback.props).map((item) => ({ ...item })),
    shots: nextShots.map(cloneShotDraft),
    dubbing: cloneDubbingDraft(draft.dubbing ?? fallback.dubbing),
  }
}
