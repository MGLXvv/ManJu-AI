import { storyboardShotsMock, storyboardStylesMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import { delay } from '@/api/local'
import { MOCK_MEDIA_IMAGE_URL, MOCK_MEDIA_VIDEO_16_9_URL, MOCK_MEDIA_VIDEO_9_16_URL } from '@/mocks/mockMedia'
import { mediaUploadService } from '@/services/media'
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
  image: { url: string; mediaId?: string; label?: string; sourceShotId?: string },
): StoryboardReferenceImage[] =>
  [
    {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: image.url,
      mediaId: image.mediaId,
      label: image.label,
      sourceShotId: image.sourceShotId,
    },
    ...shot.referenceImages,
  ].slice(0, 8)

const createGeneratedImage = (kind: string, shot: StoryboardShot): string =>
  `${MOCK_MEDIA_IMAGE_URL}?kind=${encodeURIComponent(kind)}&shot=${encodeURIComponent(shot.id)}&ratio=${encodeURIComponent(shot.ratio)}&v=${Date.now()}`

const resolveMockVideoUrl = (shot: StoryboardShot): string =>
  shot.ratio === '9:16' ? MOCK_MEDIA_VIDEO_9_16_URL : MOCK_MEDIA_VIDEO_16_9_URL

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
      imageMediaId: target.mediaId,
      status: 'success',
    })
  },

  async uploadShotImage(shot, imageUrl) {
    await delay(80)
    const media = await mediaUploadService.captureUrl(
      imageUrl,
      { targetType: 'storyboard-image', targetId: shot.id, kind: 'image' },
      `${shot.id}-upload`,
    )
    return cloneStoryboardShot({
      ...shot,
      imageUrl,
      imageMediaId: media?.mediaId,
      status: 'success',
      referenceImages: prependReferenceImage(shot, {
        url: imageUrl,
        mediaId: media?.mediaId,
        label: '上传图片',
        sourceShotId: shot.id,
      }),
    })
  },

  async uploadShotVideo(shot, videoUrl) {
    await delay(80)
    const media = await mediaUploadService.captureUrl(
      videoUrl,
      { targetType: 'storyboard-video', targetId: shot.id, kind: 'video' },
      `${shot.id}-video`,
    )
    return cloneStoryboardShot({
      ...shot,
      videoUrl: media?.url ?? videoUrl,
      videoMediaId: media?.mediaId,
      status: 'success',
    })
  },

  async applyEditedImage(shot, imageUrl) {
    await delay(80)
    const media = await mediaUploadService.captureUrl(
      imageUrl,
      { targetType: 'storyboard-edit', targetId: shot.id, kind: 'image' },
      `${shot.id}-edited.svg`,
    )
    return cloneStoryboardShot({
      ...shot,
      imageUrl,
      imageMediaId: media?.mediaId,
      status: 'success',
      referenceImages: prependReferenceImage(shot, {
        url: imageUrl,
        mediaId: media?.mediaId,
        label: '编辑结果',
        sourceShotId: shot.id,
      }),
    })
  },

  async generateShotImage(shot) {
    await delay(1200)
    const imageUrl = createGeneratedImage('storyboard', shot)
    return {
      imageUrl,
      shot: cloneStoryboardShot({
        ...shot,
        status: 'success',
        imageUrl,
        imageMediaId: undefined,
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
    const videoUrl = resolveMockVideoUrl(shot)
    return {
      videoUrl,
      shot: cloneStoryboardShot({
        ...shot,
        status: 'success',
        videoUrl,
        videoMediaId: undefined,
      }),
    }
  },

  async upscaleShotImage(shot) {
    await delay(900)
    const imageUrl = createGeneratedImage('storyboard-upscale', shot)
    return {
      imageUrl,
      shot: cloneStoryboardShot({
        ...shot,
        imageUrl,
        imageMediaId: undefined,
        status: 'success',
        referenceImages: prependReferenceImage(shot, {
          url: imageUrl,
          label: '高清放大',
          sourceShotId: shot.id,
        }),
      }),
    }
  },
}
