import type { EditorDraft } from '@/types/editor'
import type { DubbingDraft, DubbingRoleCardDraft, DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import { buildDubbingDraftPatch as buildSharedDubbingDraftPatch } from './editorDraftMapper'

const cloneLine = (line: DubbingRoleLineDraft): DubbingRoleLineDraft => ({ ...line })

const buildLineId = (characterId: string, shotId: string): string => `${characterId}-${shotId}`

const buildCardModel = (asset: SettingAsset, savedCard?: DubbingRoleCardDraft, derivedLines: DubbingRoleLineDraft[] = []): DubbingRoleCardModel => {
  const savedLines = new Map((savedCard?.lines ?? []).map((line) => [line.id, cloneLine(line)]))
  const mergedLines = derivedLines.map((line) => savedLines.get(line.id) ?? line)

  return {
    id: asset.id,
    title: asset.title,
    imageUrl: asset.imageUrls[0] ?? '',
    selectedVoiceId: savedCard?.selectedVoiceId ?? asset.selectedVoiceId ?? asset.voiceOptions?.[0]?.id ?? '',
    voiceOptions: asset.voiceOptions?.map((item) => ({ ...item })) ?? [],
    createdAt: asset.createdAt,
    hidden: savedCard?.hidden ?? false,
    lines: mergedLines,
  }
}

export const resolveDubbingCards = (draft: EditorDraft): DubbingRoleCardModel[] => {
  const savedCards = new Map((draft.dubbing?.cards ?? []).map((card) => [card.id, card]))
  const characterAssets = draft.settingAssets.filter((asset) => asset.type === 'character')

  return characterAssets.map((asset) => {
    const derivedLines = draft.shots
      .filter((shot) => shot.characterIds.includes(asset.id) && Boolean(shot.dialogue?.trim()))
      .map<DubbingRoleLineDraft>((shot) => ({
        id: buildLineId(asset.id, shot.id),
        shotId: shot.id,
        shotLabel: shot.title,
        text: shot.dialogue?.trim() ?? '',
        status: 'idle',
      }))

    return buildCardModel(asset, savedCards.get(asset.id), derivedLines)
  })
}

export const buildDubbingDraftPatch = (input: { modelId: string; cards: DubbingRoleCardModel[] }): { dubbing: DubbingDraft } => ({
  dubbing: buildSharedDubbingDraftPatch(input).dubbing,
})
