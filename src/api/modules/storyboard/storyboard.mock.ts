import { buildStoryboardUpscaledImage } from '@/features/editor/storyboardPreviewState'
import { storyboardShotsMock, storyboardStylesMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import { delay } from '@/api/local'
import type { StoryboardImageEditRecord } from '@/types/storyboard'
import type {
  StoryboardApiContract,
  StoryboardDefaultsResponse,
  StoryboardReferenceImage,
  StoryboardShot,
  StoryboardTagOptions,
} from './storyboard.types'

export const cloneStoryboardShot = (shot: StoryboardShot): StoryboardShot => ({
  ...shot,
  characters: shot.characters.map((item) => ({ ...item })),
  scenes: shot.scenes.map((item) => ({ ...item })),
  props: shot.props.map((item) => ({ ...item })),
  referenceImages: shot.referenceImages.map((item) => ({ ...item })),
  editHistory:
    shot.editHistory?.map<StoryboardImageEditRecord>((item) => ({
      ...item,
      selection: { ...item.selection },
    })) ?? [],
  voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
  attachments: shot.attachments?.map((item) => ({ ...item })) ?? [],
})

export const cloneStoryboardTagOptions = (options: StoryboardTagOptions): StoryboardTagOptions => ({
  characters: options.characters.map((item) => ({ ...item })),
  scenes: options.scenes.map((item) => ({ ...item })),
  props: options.props.map((item) => ({ ...item })),
})

const prependReferenceImage = (
  shot: StoryboardShot,
  image: { url: string; label?: string; sourceShotId?: string },
): StoryboardReferenceImage[] => [
  {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: image.url,
    label: image.label,
    sourceShotId: image.sourceShotId,
  },
  ...shot.referenceImages,
].slice(0, 8)

const createGeneratedImage = (title: string, seed: number): string =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b4f77"/><stop offset="100%" stop-color="#8254c8"/></linearGradient></defs>
      <rect width="1280" height="720" fill="url(#g)" />
      <rect x="0" y="612" width="1280" height="108" fill="rgba(0,0,0,0.42)" />
      <text x="30" y="680" fill="white" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="54" font-weight="700">${title}</text>
    </svg>`,
  )}`

export const createDefaultStoryboardState = (): StoryboardDefaultsResponse => ({
  shots: storyboardShotsMock.map(cloneStoryboardShot),
  tagOptions: cloneStoryboardTagOptions(storyboardTagOptions),
  styleOptions: [...storyboardStylesMock],
})

export const storyboardMockApi: StoryboardApiContract = {
  async listDefaults() {
    await delay()
    return createDefaultStoryboardState()
  },

  async applyReferenceImage(shot, referenceImageId) {
    await delay(60)
    const target = shot.referenceImages.find((item) => item.id === referenceImageId)
    if (!target) {
      return null
    }

    return cloneStoryboardShot({
      ...shot,
      imageUrl: target.url,
      status: 'success',
    })
  },

  async uploadShotImage(shot, imageUrl) {
    await delay(80)
    return cloneStoryboardShot({
      ...shot,
      imageUrl,
      status: 'success',
      referenceImages: prependReferenceImage(shot, {
        url: imageUrl,
        label: '上传图片',
        sourceShotId: shot.id,
      }),
    })
  },

  async uploadShotVideo(shot, videoUrl) {
    await delay(80)
    return cloneStoryboardShot({
      ...shot,
      videoUrl,
      status: 'success',
    })
  },

  async applyEditedImage(shot, imageUrl) {
    await delay(80)
    return cloneStoryboardShot({
      ...shot,
      imageUrl,
      status: 'success',
      referenceImages: prependReferenceImage(shot, {
        url: imageUrl,
        label: '编辑结果',
        sourceShotId: shot.id,
      }),
    })
  },

  async generateShotImage(shot) {
    await delay(1200)
    const imageUrl = createGeneratedImage(`镜头生成 ${Date.now() % 10000}`, Math.floor(Math.random() * 1000))
    return {
      imageUrl,
      shot: cloneStoryboardShot({
        ...shot,
        status: 'success',
        imageUrl,
        referenceImages: prependReferenceImage(shot, {
          url: imageUrl,
          label: '生成结果',
          sourceShotId: shot.id,
        }),
      }),
    }
  },

  async generateVideo(shot) {
    await delay(980)
    const videoUrl = `mock-video://${shot.id}/${Date.now()}`
    return {
      videoUrl,
      shot: cloneStoryboardShot({
        ...shot,
        status: 'success',
        videoUrl,
      }),
    }
  },

  async upscaleShotImage(shot) {
    await delay(900)
    const result = buildStoryboardUpscaledImage({
      sourceUrl: shot.imageUrl ?? '',
      title: shot.title,
    })

    return {
      imageUrl: result.imageUrl,
      shot: cloneStoryboardShot({
        ...shot,
        imageUrl: result.imageUrl,
        status: 'success',
        referenceImages: prependReferenceImage(shot, {
          url: result.imageUrl,
          label: result.referenceLabel,
          sourceShotId: shot.id,
        }),
      }),
    }
  },
}
