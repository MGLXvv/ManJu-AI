import type { EditorDraft } from '@/types/editor'
import type { StoryboardShot, StoryboardTag, StoryboardTagOptions, StoryboardVoiceAssignment } from '@/types/storyboard'

const cloneTag = (tag: StoryboardTag): StoryboardTag => ({ ...tag })

const cloneOptions = (options: StoryboardTagOptions): StoryboardTagOptions => ({
  characters: options.characters.map(cloneTag),
  scenes: options.scenes.map(cloneTag),
  props: options.props.map(cloneTag),
})

const mapSummaryToTag =
  (type: StoryboardTag['type']) =>
  (item: { id: string; name: string }): StoryboardTag => ({
    id: item.id,
    name: item.name,
    type,
  })

const normalizeVoiceAssignments = (shot: StoryboardShot): StoryboardVoiceAssignment[] => {
  return (shot.voiceAssignments ?? []).map((item, index) => ({
    ...item,
    id: item.id || `voice-${shot.id}-${index + 1}`,
  }))
}

export const resolveStoryboardTagOptions = (
  draft: EditorDraft | null,
  fallback: StoryboardTagOptions,
): StoryboardTagOptions => {
  const hasDraftOptions = Boolean(draft?.characters.length) || Boolean(draft?.scenes.length) || Boolean(draft?.props.length)

  if (!draft || !hasDraftOptions) {
    return cloneOptions(fallback)
  }

  return {
    characters: draft.characters.map(mapSummaryToTag('character')),
    scenes: draft.scenes.map(mapSummaryToTag('scene')),
    props: draft.props.map(mapSummaryToTag('prop')),
  }
}

export const normalizeStoryboardShotsWithTagOptions = (
  shots: StoryboardShot[],
  options: StoryboardTagOptions,
): StoryboardShot[] => {
  const characterIds = new Set(options.characters.map((item) => item.id))
  const sceneIds = new Set(options.scenes.map((item) => item.id))
  const propIds = new Set(options.props.map((item) => item.id))

  return shots.map((shot) => ({
    ...shot,
    characters: shot.characters.filter((item) => characterIds.has(item.id)).map(cloneTag),
    scenes: shot.scenes.filter((item) => sceneIds.has(item.id)).map(cloneTag),
    props: shot.props.filter((item) => propIds.has(item.id)).map(cloneTag),
    voiceAssignments: normalizeVoiceAssignments(shot).filter((item) => characterIds.has(item.characterId)),
  }))
}
