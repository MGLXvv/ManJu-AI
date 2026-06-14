import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizeStoryboardShotsWithTagOptions } from '@/features/editor/storyboardDraftState'
import { shouldMockStoryboardGenerateFail } from '@/features/editor/storyboardGenerationState'
import { buildStoryboardUpscaledImage } from '@/features/editor/storyboardPreviewState'
import { shouldMockVideoGenerateFail } from '@/features/editor/videoGenerationState'
import { storyboardShotsMock, storyboardStylesMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { StoryboardRatio, StoryboardShot, StoryboardTag, StoryboardTagOptions, StoryboardVoiceAssignment } from '@/types/storyboard'

const cloneShot = (shot: StoryboardShot): StoryboardShot => ({
  ...shot,
  characters: shot.characters.map((item) => ({ ...item })),
  scenes: shot.scenes.map((item) => ({ ...item })),
  props: shot.props.map((item) => ({ ...item })),
  referenceImages: shot.referenceImages.map((item) => ({ ...item })),
  voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
  attachments: shot.attachments?.map((item) => ({ ...item })) ?? [],
})

const prependReferenceImage = (
  shot: StoryboardShot,
  image: { url: string; label?: string; sourceShotId?: string },
): StoryboardShot['referenceImages'] => [
  {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    label: image.label,
    sourceShotId: image.sourceShotId,
  },
  ...shot.referenceImages,
].slice(0, 8)

const cloneTagOptions = (options: StoryboardTagOptions): StoryboardTagOptions => ({
  characters: options.characters.map((item) => ({ ...item })),
  scenes: options.scenes.map((item) => ({ ...item })),
  props: options.props.map((item) => ({ ...item })),
})

const createInitialShots = (): StoryboardShot[] => storyboardShotsMock.map(cloneShot)
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

export const useStoryboardStore = defineStore('storyboard', () => {
  const shots = ref<StoryboardShot[]>(createInitialShots())
  const activeShotId = ref(shots.value[0]?.id ?? '')
  const tagOptionsState = ref<StoryboardTagOptions>(cloneTagOptions(storyboardTagOptions))

  const tagOptions = computed(() => tagOptionsState.value)
  const styleOptions = computed(() => storyboardStylesMock)

  const activeShot = computed(() => shots.value.find((item) => item.id === activeShotId.value) ?? null)
  const referenceImages = computed(() => activeShot.value?.referenceImages ?? [])

  const selectShot = (id: string): void => {
    activeShotId.value = id
  }

  const getShotById = (id: string): StoryboardShot | undefined => shots.value.find((item) => item.id === id)

  const isShotLocked = (id: string): boolean => Boolean(getShotById(id)?.isLocked)

  const setTagOptions = (options: StoryboardTagOptions): void => {
    tagOptionsState.value = cloneTagOptions(options)
    shots.value = normalizeStoryboardShotsWithTagOptions(shots.value, tagOptionsState.value)
  }

  const replaceShots = (nextShots: StoryboardShot[]): void => {
    shots.value = normalizeStoryboardShotsWithTagOptions(nextShots.map(cloneShot), tagOptionsState.value)
    activeShotId.value = shots.value[0]?.id ?? ''
  }

  const resetShots = (): void => {
    shots.value = normalizeStoryboardShotsWithTagOptions(createInitialShots(), tagOptionsState.value)
    activeShotId.value = shots.value[0]?.id ?? ''
  }

  const patchShotById = (id: string, patch: Partial<StoryboardShot>): void => {
    shots.value = shots.value.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot))
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
    style: styleOptions.value[0] ?? '国风漫画',
    ratio: '16:9',
    status: 'pending-review',
    isHidden: false,
    isFavorite: false,
    isLocked: false,
    createdAt: '2026年3月12日 17:16',
    referenceImages: [],
  })

  const updateActiveShot = (patch: Partial<StoryboardShot>): void => {
    if (!activeShot.value) return
    patchShotById(activeShot.value.id, patch)
  }

  const updateShotImage = (id: string, image: { url: string; label?: string; sourceShotId?: string }): void => {
    const shot = shots.value.find((item) => item.id === id)
    if (!shot) return

    patchShotById(id, {
      imageUrl: image.url,
      status: 'success',
      referenceImages: prependReferenceImage(shot, image),
    })
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

  const toggleFavorite = (id: string): void => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return
    patchShotById(id, { isFavorite: !target.isFavorite })
  }

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
    const duplicated = cloneShot({
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

  const applyReferenceImageToShot = (shotId: string, referenceImageId: string): void => {
    if (isShotLocked(shotId)) return
    const shot = shots.value.find((item) => item.id === shotId)
    if (!shot) return

    const target = shot.referenceImages.find((item) => item.id === referenceImageId)
    if (!target) return

    patchShotById(shotId, {
      imageUrl: target.url,
      status: 'success',
    })
  }

  const uploadShotImage = (shotId: string, imageUrl: string): void => {
    if (isShotLocked(shotId)) return
    updateShotImage(shotId, {
      url: imageUrl,
      label: '上传图片',
      sourceShotId: shotId,
    })
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

  const applyEditedImageToShot = (shotId: string, imageUrl: string): void => {
    if (isShotLocked(shotId)) return
    updateShotImage(shotId, {
      url: imageUrl,
      label: '编辑结果',
      sourceShotId: shotId,
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
    await new Promise((resolve) => globalThis.setTimeout(resolve, 1200))

    if (shouldMockStoryboardGenerateFail({ title: target.title, prompt: target.prompt })) {
      patchShotById(id, { status: 'failed' })
      throw new Error('STORYBOARD_GENERATE_FAILED')
    }

    const now = Date.now()
    const newImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b4f77"/><stop offset="100%" stop-color="#8254c8"/></linearGradient></defs>
        <rect width="1280" height="720" fill="url(#g)" />
        <rect x="0" y="612" width="1280" height="108" fill="rgba(0,0,0,0.42)" />
        <text x="30" y="680" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="54" font-weight="700">镜头生成 ${now % 10000}</text>
      </svg>`,
    )}`

    shots.value = shots.value.map((shot) => {
      if (shot.id !== id) return shot
      return {
        ...shot,
        status: 'success',
        imageUrl: newImage,
        referenceImages: prependReferenceImage(shot, { url: newImage, label: '生成结果', sourceShotId: id }),
      }
    })
  }

  const generateActiveShot = async (): Promise<void> => {
    if (!activeShot.value) return
    await generateShotById(activeShot.value.id)
  }

  const generateVideoById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target || target.isLocked) return

    patchShotById(id, { status: 'generating' })
    await new Promise((resolve) => globalThis.setTimeout(resolve, 980))

    if (
      shouldMockVideoGenerateFail({
        title: target.title,
        videoPrompt: target.videoPrompt ?? '',
        dialogue: target.dialogue ?? '',
      })
    ) {
      patchShotById(id, { status: 'failed' })
      throw new Error('VIDEO_GENERATE_FAILED')
    }

    shots.value = shots.value.map((shot) =>
      shot.id === id
        ? {
            ...shot,
            status: 'success',
            videoUrl: `mock-video://${id}/${Date.now()}`,
          }
        : shot,
    )
  }

  const generateActiveVideo = async (): Promise<void> => {
    if (!activeShot.value) return
    await generateVideoById(activeShot.value.id)
  }

  const upscaleShotById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target || target.isLocked) return
    if (!target.imageUrl) {
      throw new Error('STORYBOARD_UPSCALE_IMAGE_REQUIRED')
    }

    patchShotById(id, { status: 'generating' })
    await new Promise((resolve) => globalThis.setTimeout(resolve, 900))

    const result = buildStoryboardUpscaledImage({
      sourceUrl: target.imageUrl,
      title: target.title,
    })

    updateShotImage(id, {
      url: result.imageUrl,
      label: result.referenceLabel,
      sourceShotId: id,
    })
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
    applyEditedImageToShot,
    markShotsGenerating,
    addTagToActiveShot,
    removeTagFromActiveShot,
    generateShotById,
    generateActiveShot,
    generateVideoById,
    generateActiveVideo,
    upscaleShotById,
  }
})
