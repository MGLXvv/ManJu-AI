import type { EditorDraft } from '@/types/editor'
import type { DubbingDraft, DubbingRoleCardDraft, DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardVoiceAssignment } from '@/types/storyboard'
import { buildDubbingDraftPatch as buildSharedDubbingDraftPatch } from './editorDraftMapper'

const cloneLine = (line: DubbingRoleLineDraft): DubbingRoleLineDraft => ({ ...line })

const buildLineId = (characterId: string, shotId: string): string => `${characterId}-${shotId}`

const cloneVoiceAssignment = (assignment: StoryboardVoiceAssignment): StoryboardVoiceAssignment => ({ ...assignment })

const resolveCardSelectedVoiceIdFromAssignments = (draft: EditorDraft, characterId: string, voiceOptions: SettingAsset['voiceOptions']): string => {
  for (const shot of draft.shots) {
    const assignment = shot.voiceAssignments?.find((item) => item.characterId === characterId)
    if (!assignment) {
      continue
    }

    const assignmentVoiceId = assignment.voiceId?.trim()
    if (assignmentVoiceId) {
      return assignmentVoiceId
    }

    const assignmentVoiceName = assignment.voiceName?.trim() || assignment.voice.trim()
    if (!assignmentVoiceName) {
      continue
    }

    const matchedOption = voiceOptions?.find((option) => option.name.trim() === assignmentVoiceName)
    if (matchedOption?.id) {
      return matchedOption.id
    }
  }

  return ''
}

const resolveAssetSelectedVoiceId = (asset: SettingAsset): string =>
  asset.voiceId?.trim() || asset.selectedVoiceId?.trim() || asset.voiceOptions?.[0]?.id || ''

const resolveCardSelectedVoiceId = (draft: EditorDraft, asset: SettingAsset, savedCard?: DubbingRoleCardDraft): string =>
  savedCard?.selectedVoiceId ||
  resolveCardSelectedVoiceIdFromAssignments(draft, asset.id, asset.voiceOptions) ||
  resolveAssetSelectedVoiceId(asset)

const buildCardModel = (
  draft: EditorDraft,
  asset: SettingAsset,
  savedCard?: DubbingRoleCardDraft,
  derivedLines: DubbingRoleLineDraft[] = [],
): DubbingRoleCardModel => {
  const savedLines = new Map((savedCard?.lines ?? []).map((line) => [line.id, cloneLine(line)]))
  const mergedLines = derivedLines.map((line) => savedLines.get(line.id) ?? line)

  return {
    id: asset.id,
    title: asset.title,
    imageUrl: asset.imageUrls[0] ?? '',
    selectedVoiceId: resolveCardSelectedVoiceId(draft, asset, savedCard),
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

    return buildCardModel(draft, asset, savedCards.get(asset.id), derivedLines)
  })
}

const resolveCardVoiceSelection = (card: DubbingRoleCardModel): { voiceId?: string; voiceName?: string; voice: string } | null => {
  const selectedVoiceId = card.selectedVoiceId.trim()
  if (!selectedVoiceId) {
    return null
  }

  const selectedOption = card.voiceOptions.find((option) => option.id === selectedVoiceId)
  const voiceName = selectedOption?.name.trim() || undefined

  return {
    voiceId: selectedVoiceId,
    voiceName,
    voice: voiceName ?? selectedVoiceId,
  }
}

export const syncDubbingVoiceSelectionsToShots = (
  shots: EditorDraft['shots'],
  cards: DubbingRoleCardModel[],
): EditorDraft['shots'] => {
  const voiceSelectionMap = new Map(
    cards
      .map((card) => [card.id, resolveCardVoiceSelection(card)] as const)
      .filter((entry): entry is [string, NonNullable<ReturnType<typeof resolveCardVoiceSelection>>] => Boolean(entry[1])),
  )

  return shots.map((shot) => {
    const nextAssignments = (shot.voiceAssignments ?? []).map(cloneVoiceAssignment)
    let changed = false

    for (const characterId of shot.characterIds) {
      const selection = voiceSelectionMap.get(characterId)
      if (!selection) {
        continue
      }

      const matchingAssignments = nextAssignments.filter((item) => item.characterId === characterId)
      if (matchingAssignments.length > 0) {
        for (const assignment of matchingAssignments) {
          assignment.voiceId = selection.voiceId
          assignment.voiceName = selection.voiceName
          assignment.voice = selection.voice
        }
        changed = true
        continue
      }

      nextAssignments.push({
        id: `voice-${shot.id}-${characterId}`,
        characterId,
        voiceId: selection.voiceId,
        voiceName: selection.voiceName,
        voice: selection.voice,
      })
      changed = true
    }

    return changed
      ? {
          ...shot,
          voiceAssignments: nextAssignments,
        }
      : {
          ...shot,
          voiceAssignments: nextAssignments,
        }
  })
}

export const buildDubbingDraftUpdate = (
  draft: EditorDraft,
  input: { modelId: string; cards: DubbingRoleCardModel[] },
): Pick<EditorDraft, 'dubbing' | 'shots'> => ({
  dubbing: buildSharedDubbingDraftPatch(input).dubbing,
  shots: syncDubbingVoiceSelectionsToShots(draft.shots, input.cards),
})

export const buildDubbingDraftPatch = (input: { modelId: string; cards: DubbingRoleCardModel[] }): { dubbing: DubbingDraft } => ({
  dubbing: buildSharedDubbingDraftPatch(input).dubbing,
})
