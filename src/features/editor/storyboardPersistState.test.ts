import { describe, expect, it } from 'vitest'
import { storyboardShotsMock } from '@/mocks/storyboard.mock'
import type { Shot } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
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

const characterAsset: SettingAsset = {
  id: 'ch-1',
  type: 'character',
  title: '赵灵儿',
  roleName: '女主',
  description: '角色描述',
  prompt: '角色提示词',
  imageUrls: ['asset-image-1'],
  candidateImages: [],
  voiceId: 'voice-soft-female',
  voiceName: '温柔女声',
  selectedVoiceId: 'voice-soft-female',
  voiceOptions: [{ id: 'voice-soft-female', name: '温柔女声' }],
  status: 'ready',
  favorite: false,
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

  it('fills missing voice assignments from character asset default voices', () => {
    const [draftShot] = buildStoryboardDraftShots([
      {
        ...storyboardShot,
        voiceAssignments: [],
      },
    ])

    const [resolvedShot] = resolveStoryboardShots([draftShot], tagOptions, [characterAsset])

    expect(resolvedShot.voiceAssignments).toEqual([
      {
        id: 'voice-shot-1-1',
        characterId: 'ch-1',
        voiceId: 'voice-soft-female',
        voiceName: '温柔女声',
        voice: '温柔女声',
      },
    ])
  })

  it('keeps existing assignment voices when resolving shots with setting defaults', () => {
    const [draftShot] = buildStoryboardDraftShots([
      {
        ...storyboardShot,
        voiceAssignments: [
          {
            id: 'voice-existing',
            characterId: 'ch-1',
            voiceId: 'voice-existing',
            voiceName: '冷艳御姐',
            voice: '冷艳御姐',
          },
        ],
      },
    ])

    const [resolvedShot] = resolveStoryboardShots([draftShot], tagOptions, [characterAsset])

    expect(resolvedShot.voiceAssignments).toEqual([
      {
        id: 'voice-existing',
        characterId: 'ch-1',
        voiceId: 'voice-existing',
        voiceName: '冷艳御姐',
        voice: '冷艳御姐',
      },
    ])
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
  it('blocks entering video when storyboard mode is missing', () => {
    expect(validateStoryboardBeforeVideo([storyboardShot], null)).toEqual({
      ok: false,
      message: '请先选择分镜生成模式',
    })
  })

  it('blocks entering video in image mode when no generated shot exists', () => {
    expect(validateStoryboardBeforeVideo([], 'image')).toEqual({
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
      ], 'image'),
    ).toEqual({
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })
  })

  it('ignores hidden shots when validating image mode before video', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          id: 'shot-hidden',
          isHidden: true,
          status: 'success',
          imageUrl: 'hidden-image',
        },
      ], 'image'),
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
      ], 'image'),
    ).toEqual({
      ok: false,
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })
  })

  it('allows entering video in image mode when every visible shot has a generated first frame', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          isHidden: false,
        },
      ], 'image'),
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
      ], 'image'),
    ).toEqual({
      ok: true,
      message: '',
    })
  })

  it('allows multi-param mode without image urls when visible shots have prompts', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          isHidden: false,
          imageUrl: '',
          status: 'pending-review',
          prompt: '角色站在雨夜街头回望，情绪压抑',
        },
      ], 'multi-param'),
    ).toEqual({
      ok: true,
      message: '',
    })
  })

  it('blocks multi-param mode when any visible shot lacks prompt text', () => {
    expect(
      validateStoryboardBeforeVideo([
        {
          ...storyboardShot,
          isHidden: false,
          imageUrl: '',
          status: 'pending-review',
          prompt: '   ',
        },
      ], 'multi-param'),
    ).toEqual({
      ok: false,
      message: '请先补充分镜画面描述后再进入视频生成',
    })
  })
})

