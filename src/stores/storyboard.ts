import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  cloneStoryboardShot,
  cloneStoryboardTagOptions,
  createDefaultStoryboardState,
  storyboardApi,
} from '@/api/storyboard.api'
import { normalizeStoryboardShotsWithTagOptions } from '@/features/editor/storyboardDraftState'
import { buildStoryboardImageEditRecord } from '@/features/editor/storyboardPreviewState'
import { storyboardGenerationService, storyboardPromptService, videoGenerationService } from '@/services/generation'
import { useEditorStore } from '@/stores/editor'
import { API_ERROR_CODES } from '@/types/api-enums'
import type {
  StoryboardImageEditSelection,
  StoryboardRatio,
  StoryboardShot,
  StoryboardTag,
  StoryboardTagOptions,
  StoryboardVoiceAssignment,
} from '@/types/storyboard'

const SHOT_TITLE_PATTERN = /^镜头\s*(\d+)([A-Z]+)?$/

const parseShotTitle = (title: string, fallbackBase: number): { base: number; isPrimary: boolean } => {
  const match = title.match(SHOT_TITLE_PATTERN)
  if (!match) {
    return {
      base: fallbackBase,
      isPrimary: true,
    }
  }

  return {
    base: Number(match[1]),
    isPrimary: !match[2],
  }
}

const buildShotTitle = (base: number, suffix = ''): string => `镜头 ${base}${suffix}`

const buildAlphaSuffix = (index: number): string => {
  let current = index
  let suffix = ''

  do {
    suffix = String.fromCharCode(65 + (current % 26)) + suffix
    current = Math.floor(current / 26) - 1
  } while (current >= 0)

  return suffix
}

const buildVoiceAssignmentId = (): string => `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createStoreDefaults = () => createDefaultStoryboardState()

export const useStoryboardStore = defineStore('storyboard', () => {
  const defaultState = createStoreDefaults()
  const shots = ref<StoryboardShot[]>(defaultState.shots)
  const activeShotId = ref(shots.value[0]?.id ?? '')
  const tagOptionsState = ref<StoryboardTagOptions>(defaultState.tagOptions)
  const styleOptionsState = ref<string[]>(defaultState.styleOptions)
  const editorStore = useEditorStore()

  const tagOptions = computed(() => tagOptionsState.value)
  const styleOptions = computed(() => styleOptionsState.value)

  const activeShot = computed(() => shots.value.find((item) => item.id === activeShotId.value) ?? null)
  const referenceImages = computed(() => activeShot.value?.referenceImages ?? [])

  const selectShot = (id: string): void => {
    activeShotId.value = id
  }

  const getShotById = (id: string): StoryboardShot | undefined => shots.value.find((item) => item.id === id)

  const isShotLocked = (id: string): boolean => Boolean(getShotById(id)?.isLocked)

  const setTagOptions = (options: StoryboardTagOptions): void => {
    tagOptionsState.value = cloneStoryboardTagOptions(options)
    shots.value = normalizeStoryboardShotsWithTagOptions(shots.value, tagOptionsState.value)
  }

  const replaceShots = (nextShots: StoryboardShot[]): void => {
    shots.value = normalizeStoryboardShotsWithTagOptions(nextShots.map(cloneStoryboardShot), tagOptionsState.value)
    activeShotId.value = shots.value[0]?.id ?? ''
  }

  const resetShots = (): void => {
    const defaults = createStoreDefaults()
    styleOptionsState.value = defaults.styleOptions
    shots.value = normalizeStoryboardShotsWithTagOptions(defaults.shots, tagOptionsState.value)
    activeShotId.value = shots.value[0]?.id ?? ''
  }

  const loadDefaults = async (): Promise<void> => {
    const defaults = await storyboardApi.listDefaults()
    styleOptionsState.value = defaults.styleOptions
    tagOptionsState.value = defaults.tagOptions
    shots.value = normalizeStoryboardShotsWithTagOptions(defaults.shots, defaults.tagOptions)
    activeShotId.value = shots.value[0]?.id ?? ''
  }

  const patchShotById = (id: string, patch: Partial<StoryboardShot>): void => {
    shots.value = shots.value.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot))
  }

  const replaceShotById = (id: string, nextShot: StoryboardShot): void => {
    shots.value = shots.value.map((shot) => (shot.id === id ? nextShot : shot))
  }

  const patchShotsByIds = (ids: string[], patch: Partial<StoryboardShot>): void => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    shots.value = shots.value.map((shot) => (idSet.has(shot.id) ? { ...shot, ...patch } : shot))
  }

  const resequenceShots = (nextShots: StoryboardShot[]): StoryboardShot[] => {
    const derivedCountByBase = new Map<number, number>()

    return nextShots.map((shot, index) => {
      const fallbackBase = index + 1
      const { base, isPrimary } = parseShotTitle(shot.title, fallbackBase)

      if (isPrimary) {
        return {
          ...shot,
          index: index + 1,
          title: buildShotTitle(base),
        }
      }

      const derivedCount = derivedCountByBase.get(base) ?? 0
      derivedCountByBase.set(base, derivedCount + 1)

      return {
        ...shot,
        index: index + 1,
        title: buildShotTitle(base, buildAlphaSuffix(derivedCount)),
      }
    })
  }

  const buildBlankShot = (index: number, title = buildShotTitle(index)): StoryboardShot => ({
    id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    index,
    title,
    imageUrl: '',
    videoUrl: '',
    prompt: '',
    videoPrompt: '',
    dialogue: '',
    durationSeconds: 10,
    voiceAssignments: [],
    attachments: [],
    characters: [],
    scenes: [],
    props: [],
    style: styleOptions.value[0] ?? '写实',
    ratio: '16:9',
    status: 'pending-review',
    isHidden: false,
    isLocked: false,
    storyboardReviewed: false,
    videoReviewed: false,
    createdAt: '2026年3月12日 17:16',
    referenceImages: [],
  })

  const updateActiveShot = (patch: Partial<StoryboardShot>): void => {
    if (!activeShot.value) return
    patchShotById(activeShot.value.id, patch)
  }

  const updateActiveShotPrompt = (prompt: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ prompt })
  }

  const updateActiveShotStyle = (style: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ style })
  }

  const updateActiveShotRatio = (ratio: StoryboardRatio): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ ratio })
  }

  const updateActiveShotVideoPrompt = (videoPrompt: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ videoPrompt })
  }

  const updateActiveShotDialogue = (dialogue: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ dialogue })
  }

  const updateActiveShotDuration = (durationSeconds: number): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({ durationSeconds })
  }

  const addActiveShotVoiceAssignment = ({
    characterId,
    voice,
    afterId,
  }: {
    characterId: string
    voice: string
    afterId?: string | null
  }): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    const nextAssignments = [...(activeShot.value.voiceAssignments ?? [])]

    const nextAssignment: StoryboardVoiceAssignment = {
      id: buildVoiceAssignmentId(),
      characterId,
      voice,
    }

    if (!afterId) {
      nextAssignments.push(nextAssignment)
    } else {
      const insertIndex = nextAssignments.findIndex((item) => item.id === afterId)
      if (insertIndex < 0) {
        nextAssignments.push(nextAssignment)
      } else {
        nextAssignments.splice(insertIndex + 1, 0, nextAssignment)
      }
    }

    updateActiveShot({ voiceAssignments: nextAssignments })
  }

  const updateActiveShotVoice = (assignmentId: string, voice: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({
      voiceAssignments: (activeShot.value.voiceAssignments ?? []).map((item) =>
        item.id === assignmentId
          ? {
              ...item,
              voice,
            }
          : item,
      ),
    })
  }

  const updateActiveShotVoiceCharacter = (assignmentId: string, characterId: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({
      voiceAssignments: (activeShot.value.voiceAssignments ?? []).map((item) =>
        item.id === assignmentId
          ? {
              ...item,
              characterId,
            }
          : item,
      ),
    })
  }

  const removeActiveShotVoice = (assignmentId: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({
      voiceAssignments: (activeShot.value.voiceAssignments ?? []).filter((item) => item.id !== assignmentId),
    })
  }

  const removeActiveShotVoicesByCharacter = (characterId: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    updateActiveShot({
      voiceAssignments: (activeShot.value.voiceAssignments ?? []).filter((item) => item.characterId !== characterId),
    })
  }

  const addActiveShotAttachment = (attachment: { name: string; size: number; type: string }): void => {
    if (!activeShot.value || activeShot.value.isLocked) return

    updateActiveShot({
      attachments: [
        ...(activeShot.value.attachments ?? []),
        {
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
        },
      ],
    })
  }

  const removeActiveShotAttachment = (attachmentId: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return

    updateActiveShot({
      attachments: (activeShot.value.attachments ?? []).filter((item) => item.id !== attachmentId),
    })
  }

  const toggleStoryboardReviewed = (id: string): void => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return
    patchShotById(id, { storyboardReviewed: !(target.storyboardReviewed ?? target.isFavorite ?? false) })
  }

  /** @deprecated 兼容旧调用，请使用 toggleStoryboardReviewed */
  const toggleFavorite = toggleStoryboardReviewed

  const toggleLock = (id: string): void => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return
    patchShotById(id, { isLocked: !target.isLocked })
  }

  const toggleHidden = (id: string): void => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return
    patchShotById(id, { isHidden: !target.isHidden })
  }

  const createBlankShot = (): void => {
    const nextShots = [...shots.value]
    const lastShot = nextShots.at(-1)
    const base = lastShot ? parseShotTitle(lastShot.title, lastShot.index).base : 1
    const newShot = buildBlankShot(nextShots.length + 1, buildShotTitle(base, lastShot ? 'A' : ''))
    nextShots.push(newShot)
    shots.value = resequenceShots(nextShots)
    activeShotId.value = newShot.id
  }

  const insertBlankShotAfter = (id: string): void => {
    const sourceIndex = shots.value.findIndex((item) => item.id === id)
    if (sourceIndex < 0) return

    const nextShots = [...shots.value]
    const source = nextShots[sourceIndex]
    const sourceBase = parseShotTitle(source.title, source.index).base
    const newShot = buildBlankShot(sourceIndex + 2, buildShotTitle(sourceBase, 'A'))
    nextShots.splice(sourceIndex + 1, 0, newShot)
    shots.value = resequenceShots(nextShots)
    activeShotId.value = newShot.id
  }

  const copyShot = (id: string): void => {
    const sourceIndex = shots.value.findIndex((item) => item.id === id)
    if (sourceIndex < 0) return
    const source = shots.value[sourceIndex]
    const sourceBase = parseShotTitle(source.title, source.index).base
    const duplicated = cloneStoryboardShot({
      ...source,
      id: `shot-${Date.now()}`,
      index: sourceIndex + 2,
      title: buildShotTitle(sourceBase, 'A'),
      createdAt: '2026年3月12日 17:16',
    })
    const nextShots = [...shots.value]
    nextShots.splice(sourceIndex + 1, 0, duplicated)
    shots.value = resequenceShots(nextShots)
  }

  const deleteShot = (id: string): void => {
    shots.value = shots.value.filter((item) => item.id !== id)
    if (!shots.value.some((item) => item.id === activeShotId.value)) {
      activeShotId.value = shots.value[0]?.id ?? ''
    }
    shots.value = resequenceShots(shots.value)
  }

  const moveShot = (draggedId: string, targetId: string): void => {
    if (draggedId === targetId) return

    const draggedIndex = shots.value.findIndex((item) => item.id === draggedId)
    const targetIndex = shots.value.findIndex((item) => item.id === targetId)
    if (draggedIndex < 0 || targetIndex < 0) return

    const nextShots = [...shots.value]
    const [draggedShot] = nextShots.splice(draggedIndex, 1)
    nextShots.splice(targetIndex, 0, draggedShot)
    shots.value = resequenceShots(nextShots)
  }

  const applyReferenceImageToShot = async (shotId: string, referenceImageId: string): Promise<void> => {
    if (isShotLocked(shotId)) return
    const shot = shots.value.find((item) => item.id === shotId)
    if (!shot) return

    const updated = await storyboardApi.applyReferenceImage(shot, referenceImageId)
    if (!updated) return
    replaceShotById(shotId, updated)
  }

  const uploadShotImage = async (shotId: string, imageUrl: string): Promise<void> => {
    if (isShotLocked(shotId)) return
    const shot = shots.value.find((item) => item.id === shotId)
    if (!shot) return
    const updated = await storyboardApi.uploadShotImage(shot, imageUrl)
    replaceShotById(shotId, updated)
  }

  const uploadShotVideo = async (shotId: string, videoUrl: string): Promise<void> => {
    if (isShotLocked(shotId)) return
    const shot = shots.value.find((item) => item.id === shotId)
    if (!shot) return
    const updated = await storyboardApi.uploadShotVideo(shot, videoUrl)
    replaceShotById(shotId, updated)
  }

  const markShotsGenerating = (ids: string[]): void => {
    patchShotsByIds(
      ids.filter((id) => {
        const shot = getShotById(id)
        return Boolean(shot && !shot.isLocked)
      }),
      { status: 'generating' },
    )
  }

  const applyEditedImageToShot = async (
    shotId: string,
    input: { imageUrl: string; prompt: string; selection: StoryboardImageEditSelection },
  ): Promise<void> => {
    if (isShotLocked(shotId)) return
    const shot = shots.value.find((item) => item.id === shotId)
    if (!shot || !shot.imageUrl) return
    const updated = await storyboardApi.applyEditedImage(shot, input.imageUrl)
    const editRecord = buildStoryboardImageEditRecord({
      prompt: input.prompt,
      selection: input.selection,
      sourceImageUrl: shot.imageUrl,
      resultImageUrl: input.imageUrl,
    })
    replaceShotById(shotId, {
      ...updated,
      editHistory: [...(shot.editHistory ?? []), editRecord],
    })
  }

  const addTagToActiveShot = (type: StoryboardTag['type'], tag: StoryboardTag): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    const current = activeShot.value[key]
    if (current.some((item) => item.id === tag.id)) return
    updateActiveShot({
      [key]: [...current, tag],
    } as Partial<StoryboardShot>)
  }

  const removeTagFromActiveShot = (type: StoryboardTag['type'], tagId: string): void => {
    if (!activeShot.value || activeShot.value.isLocked) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    updateActiveShot({
      [key]: activeShot.value[key].filter((item) => item.id !== tagId),
    } as Partial<StoryboardShot>)

    if (type === 'character') {
      removeActiveShotVoicesByCharacter(tagId)
    }
  }

  const generateShotById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target || target.isLocked) return

    patchShotById(id, { status: 'generating' })

    try {
      const result = await storyboardGenerationService.generateShotImage({
        projectId: editorStore.currentProjectId ?? 'mock-project',
        shot: target,
      })

      replaceShotById(id, result.shot)
    } catch (error) {
      patchShotById(id, { status: 'failed' })
      throw error
    }
  }

  const optimizeShotPromptsByIds = async (ids: string[]): Promise<void> => {
    const idSet = new Set(ids)
    const targets = shots.value.filter(
      (shot) => idSet.has(shot.id) && !shot.isLocked && shot.prompt.trim(),
    )

    if (targets.length === 0) return

    const result = await storyboardPromptService.optimizePrompts({
      projectId: editorStore.currentProjectId ?? 'mock-project',
      items: targets.map((shot) => ({
        shotId: shot.id,
        prompt: shot.prompt,
      })),
    })

    for (const item of result.items) {
      if (item.success) {
        patchShotById(item.shotId, { prompt: item.prompt })
      }
    }
  }

  const generateActiveShot = async (): Promise<void> => {
    if (!activeShot.value) return
    await generateShotById(activeShot.value.id)
  }

  const generateVideoById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target || target.isLocked) return

    patchShotById(id, { status: 'generating' })

    try {
      const result = await videoGenerationService.generateVideo({
        projectId: editorStore.currentProjectId ?? 'mock-project',
        shot: target,
        storyboardMode: editorStore.draft?.storyboardGenerationMode ?? 'image',
      })

      replaceShotById(id, result.shot)
    } catch (error) {
      patchShotById(id, { status: 'failed' })
      throw error
    }
  }

  const generateActiveVideo = async (): Promise<void> => {
    if (!activeShot.value) return
    await generateVideoById(activeShot.value.id)
  }

  const upscaleShotById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target || target.isLocked) return
    if (!target.imageUrl) {
      throw new Error(API_ERROR_CODES.storyboardUpscaleImageRequired)
    }

    patchShotById(id, { status: 'generating' })

    try {
      const result = await storyboardGenerationService.upscaleShotImage({
        projectId: editorStore.currentProjectId ?? 'mock-project',
        shot: target,
      })

      replaceShotById(id, result.shot)
    } catch (error) {
      patchShotById(id, { status: 'failed' })
      throw error
    }
  }

  return {
    shots,
    activeShotId,
    activeShot,
    referenceImages,
    tagOptions,
    styleOptions,
    selectShot,
    setTagOptions,
    replaceShots,
    resetShots,
    loadDefaults,
    updateActiveShot,
    updateActiveShotPrompt,
    updateActiveShotStyle,
    updateActiveShotRatio,
    updateActiveShotVideoPrompt,
    updateActiveShotDialogue,
    updateActiveShotDuration,
    addActiveShotVoiceAssignment,
    updateActiveShotVoice,
    updateActiveShotVoiceCharacter,
    removeActiveShotVoice,
    removeActiveShotVoicesByCharacter,
    addActiveShotAttachment,
    removeActiveShotAttachment,
    toggleStoryboardReviewed,
    toggleFavorite,
    toggleLock,
    toggleHidden,
    createBlankShot,
    insertBlankShotAfter,
    copyShot,
    deleteShot,
    moveShot,
    applyReferenceImageToShot,
    uploadShotImage,
    uploadShotVideo,
    applyEditedImageToShot,
    markShotsGenerating,
    addTagToActiveShot,
    removeTagFromActiveShot,
    optimizeShotPromptsByIds,
    generateShotById,
    generateActiveShot,
    generateVideoById,
    generateActiveVideo,
    upscaleShotById,
  }
})
