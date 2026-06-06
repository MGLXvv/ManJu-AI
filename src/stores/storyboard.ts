import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizeStoryboardShotsWithTagOptions } from '@/features/editor/storyboardDraftState'
import { shouldMockStoryboardGenerateFail } from '@/features/editor/storyboardGenerationState'
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

const buildDefaultVoiceAssignments = (characters: StoryboardTag[]): StoryboardVoiceAssignment[] =>
  characters.map((character) => ({
    characterId: character.id,
    voice: '浑厚男中音',
  }))

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
    updateActiveShot({ prompt })
  }

  const updateActiveShotStyle = (style: string): void => {
    updateActiveShot({ style })
  }

  const updateActiveShotRatio = (ratio: StoryboardRatio): void => {
    updateActiveShot({ ratio })
  }

  const updateActiveShotVideoPrompt = (videoPrompt: string): void => {
    updateActiveShot({ videoPrompt })
  }

  const updateActiveShotDialogue = (dialogue: string): void => {
    updateActiveShot({ dialogue })
  }

  const updateActiveShotDuration = (durationSeconds: number): void => {
    updateActiveShot({ durationSeconds })
  }

  const updateActiveShotVoice = (characterId: string, voice: string): void => {
    if (!activeShot.value) return
    const nextAssignments = [...(activeShot.value.voiceAssignments ?? [])]
    const index = nextAssignments.findIndex((item) => item.characterId === characterId)

    if (index >= 0) {
      nextAssignments[index] = { characterId, voice }
    } else {
      nextAssignments.push({ characterId, voice })
    }

    updateActiveShot({ voiceAssignments: nextAssignments })
  }

  const removeActiveShotVoice = (characterId: string): void => {
    if (!activeShot.value) return
    updateActiveShot({
      voiceAssignments: (activeShot.value.voiceAssignments ?? []).filter((item) => item.characterId !== characterId),
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

  const createBlankShot = (): void => {
    const index = shots.value.length + 1
    const newShot: StoryboardShot = {
      id: `shot-${Date.now()}`,
      index,
      title: `镜头 ${index}`,
      imageUrl: '',
      videoUrl: '',
      prompt: '',
      videoPrompt: '',
      dialogue: '',
      durationSeconds: 10,
      voiceAssignments: [],
      characters: [],
      scenes: [],
      props: [],
      style: styleOptions.value[0] ?? '国风漫画',
      ratio: '16:9',
      status: 'idle',
      isFavorite: false,
      isLocked: false,
      createdAt: '2026年3月12日 17:16',
      referenceImages: [],
    }
    shots.value.push(newShot)
    activeShotId.value = newShot.id
  }

  const copyShot = (id: string): void => {
    const source = shots.value.find((item) => item.id === id)
    if (!source) return
    const nextIndex = shots.value.length + 1
    const duplicated = cloneShot({
      ...source,
      id: `shot-${Date.now()}`,
      index: nextIndex,
      title: `镜头 ${nextIndex}`,
      createdAt: '2026年3月12日 17:16',
    })
    shots.value.push(duplicated)
  }

  const deleteShot = (id: string): void => {
    shots.value = shots.value.filter((item) => item.id !== id)
    if (!shots.value.some((item) => item.id === activeShotId.value)) {
      activeShotId.value = shots.value[0]?.id ?? ''
    }
    shots.value = shots.value.map((item, index) => ({
      ...item,
      index: index + 1,
      title: `镜头 ${index + 1}`,
    }))
  }

  const applyReferenceImageToShot = (shotId: string, referenceImageId: string): void => {
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
    updateShotImage(shotId, {
      url: imageUrl,
      label: '上传图片',
      sourceShotId: shotId,
    })
  }

  const applyEditedImageToShot = (shotId: string, imageUrl: string): void => {
    updateShotImage(shotId, {
      url: imageUrl,
      label: '编辑结果',
      sourceShotId: shotId,
    })
  }

  const addTagToActiveShot = (type: StoryboardTag['type'], tag: StoryboardTag): void => {
    if (!activeShot.value) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    const current = activeShot.value[key]
    if (current.some((item) => item.id === tag.id)) return
    updateActiveShot({
      [key]: [...current, tag],
    } as Partial<StoryboardShot>)

    if (type === 'character') {
      updateActiveShot({
        voiceAssignments: [
          ...(activeShot.value.voiceAssignments ?? []),
          { characterId: tag.id, voice: '浑厚男中音' },
        ].filter((item, index, source) => source.findIndex((target) => target.characterId === item.characterId) === index),
      })
    }
  }

  const removeTagFromActiveShot = (type: StoryboardTag['type'], tagId: string): void => {
    if (!activeShot.value) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    updateActiveShot({
      [key]: activeShot.value[key].filter((item) => item.id !== tagId),
    } as Partial<StoryboardShot>)

    if (type === 'character') {
      removeActiveShotVoice(tagId)
    }
  }

  const generateShotById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return

    patchShotById(id, { status: 'pending' })
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    patchShotById(id, { status: 'generating' })
    await new Promise((resolve) => window.setTimeout(resolve, 1200))

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
    if (!target) return

    patchShotById(id, { status: 'pending' })
    await new Promise((resolve) => window.setTimeout(resolve, 320))
    patchShotById(id, { status: 'generating' })
    await new Promise((resolve) => window.setTimeout(resolve, 980))

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
    updateActiveShotVoice,
    removeActiveShotVoice,
    toggleFavorite,
    toggleLock,
    createBlankShot,
    copyShot,
    deleteShot,
    applyReferenceImageToShot,
    uploadShotImage,
    applyEditedImageToShot,
    addTagToActiveShot,
    removeTagFromActiveShot,
    generateShotById,
    generateActiveShot,
    generateVideoById,
    generateActiveVideo,
  }
})
