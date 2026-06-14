import { describe, expect, it } from 'vitest'
import { storyboardShotsMock } from '@/mocks/storyboard.mock'
import type { Shot } from '@/types/editor'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'
import {
  buildStoryboardDraftShots,
  buildStoryboardExportFileName,
  buildStoryboardExportPayload,
  resolveStoryboardShots,
  validateStoryboardBeforeVideo,
} from './storyboardPersistState'

const tagOptions: StoryboardTagOptions = {
  characters: [{ id: 'ch-1', name: '赵灵儿', type: 'character' }],
  scenes: [{ id: 'sc-1', name: '花店', type: 'scene' }],
  props: [{ id: 'pr-1', name: '一束花', type: 'prop' }],
}

const storyboardShot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'image-1',
  videoUrl: 'mock-video://shot-1/1',
  prompt: '提示词 1',
  videoPrompt: '视频提示词 1',
  dialogue: '对白 1',
  durationSeconds: 15,
  voiceAssignments: [{ id: 'voice-1', characterId: 'ch-1', voice: '温柔女声' }],
  characters: [tagOptions.characters[0]],
  scenes: [tagOptions.scenes[0]],
  props: [tagOptions.props[0]],
  style: '国风漫画',
  ratio: '16:9',
  status: 'success',
  isHidden: true,
  isLocked: true,
  isFavorite: true,
  referenceImages: [{ id: 'ref-1', url: 'ref-image-1' }],
  createdAt: '2026年3月12日 17:16',
}

describe('storyboardPersistState', () => {
  it('builds draft shots from storyboard shots', () => {
    expect(buildStoryboardDraftShots([storyboardShot])).toEqual<Shot[]>([
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '提示词 1',
        characterIds: ['ch-1'],
        sceneIds: ['sc-1'],
        propIds: ['pr-1'],
        imageUrl: 'image-1',
        videoUrl: 'mock-video://shot-1/1',
        videoPrompt: '视频提示词 1',
        dialogue: '对白 1',
        durationSeconds: 15,
        voiceAssignments: [{ id: 'voice-1', characterId: 'ch-1', voice: '温柔女声' }],
        status: 'success',
        style: '国风漫画',
        ratio: '16:9',
        isHidden: true,
        isLocked: true,
        isFavorite: true,
        referenceImages: [{ id: 'ref-1', url: 'ref-image-1' }],
        createdAt: '2026年3月12日 17:16',
      },
    ])
  })

  it('seeds storyboard mock shots as pending-review and visible', () => {
    expect(storyboardShotsMock.every((shot) => shot.status === 'pending-review' && shot.isHidden === false)).toBe(true)
  })

  it('resolves draft shots back to storyboard shots', () => {
    const draftShots = buildStoryboardDraftShots([storyboardShot])

    expect(resolveStoryboardShots(draftShots, tagOptions)).toEqual([storyboardShot])
  })

  it('normalizes legacy draft statuses when resolving shots', () => {
    const legacyDraftBase = buildStoryboardDraftShots([storyboardShot])[0]

    expect(
      resolveStoryboardShots(
        [
          {
            ...legacyDraftBase,
            status: 'idle',
          },
          {
            ...legacyDraftBase,
            id: 'shot-2',
            status: 'pending',
          },
        ],
        tagOptions,
      ).map((shot) => shot.status),
    ).toEqual(['pending-review', 'generating'])
  })

  it('builds export payload and file name', () => {
    const payload = buildStoryboardExportPayload([storyboardShot])

    expect(payload.shots).toHaveLength(1)
    expect(payload.shots[0].title).toBe('镜头 1')
    expect(buildStoryboardExportFileName('project:demo/01')).toBe('project-demo-01-storyboard.json')
  })
  it('blocks entering video when no generated shot exists', () => {
    expect(validateStoryboardBeforeVideo([])).toEqual({
      ok: false,
      message: '请至少保留一个可见分镜后再进入视频生成',
    })

    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          status: 'pending-review',
          isHidden: false,
          imageUrl: '',
        },
      ]),
    ).toEqual({
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })
  })

  it('ignores hidden shots when validating before video', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          id: 'shot-hidden',
          isHidden: true,
          status: 'success',
          imageUrl: 'hidden-image',
        },
      ]),
    ).toEqual({
      ok: false,
      message: '请至少保留一个可见分镜后再进入视频生成',
    })

    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          id: 'shot-visible-pending',
          isHidden: false,
          status: 'pending-review',
          imageUrl: '',
        },
        {
          ...storyboardShot,
          id: 'shot-hidden-success',
          isHidden: true,
          status: 'success',
          imageUrl: 'hidden-image',
        },
      ]),
    ).toEqual({
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })
  })

  it('allows entering video when every visible shot has a generated first frame', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          isHidden: false,
        },
      ]),
    ).toEqual({
      ok: true,
      message: '',
    })

    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          isHidden: false,
        },
        {
          ...storyboardShot,
          id: 'shot-hidden-pending',
          isHidden: true,
          status: 'pending-review',
          imageUrl: '',
        },
      ]),
    ).toEqual({
      ok: true,
      message: '',
    })
  })
})

