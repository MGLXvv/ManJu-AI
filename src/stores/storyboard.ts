import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { storyboardShotsMock, storyboardStylesMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { StoryboardRatio, StoryboardShot, StoryboardTag, StoryboardTagType } from '@/types/storyboard'

const cloneShot = (shot: StoryboardShot): StoryboardShot => ({
  ...shot,
  characters: shot.characters.map((item) => ({ ...item })),
  scenes: shot.scenes.map((item) => ({ ...item })),
  props: shot.props.map((item) => ({ ...item })),
  referenceImages: shot.referenceImages.map((item) => ({ ...item })),
})

export const useStoryboardStore = defineStore('storyboard', () => {
  const shots = ref<StoryboardShot[]>(storyboardShotsMock.map(cloneShot))
  const activeShotId = ref(shots.value[0]?.id ?? '')

  const tagOptions = computed(() => storyboardTagOptions)
  const styleOptions = computed(() => storyboardStylesMock)

  const activeShot = computed(() => shots.value.find((item) => item.id === activeShotId.value) ?? null)
  const referenceImages = computed(() => activeShot.value?.referenceImages ?? [])

  const selectShot = (id: string): void => {
    activeShotId.value = id
  }

  const patchShotById = (id: string, patch: Partial<StoryboardShot>): void => {
    shots.value = shots.value.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot))
  }

  const updateActiveShot = (patch: Partial<StoryboardShot>): void => {
    if (!activeShot.value) return
    patchShotById(activeShot.value.id, patch)
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
      prompt: '',
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

  const addTagToActiveShot = (type: StoryboardTagType, tag: StoryboardTag): void => {
    if (!activeShot.value) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    const current = activeShot.value[key]
    if (current.some((item) => item.id === tag.id)) return
    updateActiveShot({
      [key]: [...current, tag],
    } as Partial<StoryboardShot>)
  }

  const removeTagFromActiveShot = (type: StoryboardTagType, tagId: string): void => {
    if (!activeShot.value) return
    const key = type === 'character' ? 'characters' : type === 'scene' ? 'scenes' : 'props'
    updateActiveShot({
      [key]: activeShot.value[key].filter((item) => item.id !== tagId),
    } as Partial<StoryboardShot>)
  }

  const generateShotById = async (id: string): Promise<void> => {
    const target = shots.value.find((item) => item.id === id)
    if (!target) return

    patchShotById(id, { status: 'pending' })
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    patchShotById(id, { status: 'generating' })
    await new Promise((resolve) => window.setTimeout(resolve, 1200))

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
        referenceImages: [{ id: `ref-${now}`, url: newImage }, ...shot.referenceImages].slice(0, 8),
      }
    })
  }

  const generateActiveShot = async (): Promise<void> => {
    if (!activeShot.value) return
    await generateShotById(activeShot.value.id)
  }

  return {
    shots,
    activeShotId,
    activeShot,
    referenceImages,
    tagOptions,
    styleOptions,
    selectShot,
    updateActiveShot,
    updateActiveShotPrompt,
    updateActiveShotStyle,
    updateActiveShotRatio,
    toggleFavorite,
    toggleLock,
    createBlankShot,
    copyShot,
    deleteShot,
    addTagToActiveShot,
    removeTagFromActiveShot,
    generateShotById,
    generateActiveShot,
  }
})
