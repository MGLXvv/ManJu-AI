import { describe, expect, it } from 'vitest'
import type { DubbingDraft } from '@/types/dubbing'
import type { EditorDraft, Shot } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardVoiceAssignment } from '@/types/storyboard'
import {
  EDITOR_ROUTE_SEQUENCE,
  isEditorStepRouteName,
  resolveEditorRouteGuard,
  resolveFirstIncompleteEditorRoute,
} from '@/features/editor/editorRouteGuardState'

const makeSettingAsset = (overrides: Partial<SettingAsset> = {}): SettingAsset => ({
  id: 'asset-1',
  type: 'character',
  title: '角色 1',
  roleName: '主角',
  description: '角色描述',
  prompt: '角色提示词',
  imageUrls: [],
  candidateImages: [],
  voiceOptions: [],
  status: 'empty',
  favorite: false,
  createdAt: '2026-03-12 17:16',
  ...overrides,
})

const makeVoiceAssignment = (overrides: Partial<StoryboardVoiceAssignment> = {}): StoryboardVoiceAssignment => ({
  id: 'voice-1',
  characterId: 'character-1',
  voice: '温柔女声',
  ...overrides,
})

const makeShot = (overrides: Partial<Shot> = {}): Shot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  description: '夜晚街道，角色回头',
  characterIds: ['character-1'],
  sceneIds: ['scene-1'],
  propIds: [],
  imageUrl: '',
  videoUrl: '',
  videoPrompt: '夜晚街道氛围',
  dialogue: '我们走吧。',
  durationSeconds: 10,
  voiceAssignments: [makeVoiceAssignment()],
  status: 'pending-review',
  style: '国风漫画',
  ratio: '16:9',
  isHidden: false,
  isLocked: false,
  isFavorite: false,
  referenceImages: [],
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

const makeDubbingDraft = (cards: DubbingDraft['cards'] = []): DubbingDraft => ({
  modelId: 'dub-model',
  cards,
})

const makeDraft = (overrides: Partial<EditorDraft> = {}): EditorDraft => ({
  projectId: 'project-1',
  script: {
    content: '',
    prompt: '',
    generated: '',
    updatedAt: '2026-03-12 17:16',
  },
  characters: [],
  scenes: [],
  props: [],
  settingAssets: [],
  storyboardGenerationMode: null,
  shots: [],
  dubbing: makeDubbingDraft(),
  ...overrides,
})

describe('editorRouteGuardState', () => {
  it('defines the editor route sequence in workflow order', () => {
    expect(EDITOR_ROUTE_SEQUENCE).toEqual([
      'editor-script',
      'editor-settings',
      'editor-storyboard',
      'editor-video',
      'editor-dubbing',
      'editor-complete',
    ])
  })

  it('recognizes editor step route names', () => {
    expect(isEditorStepRouteName('editor-script')).toBe(true)
    expect(isEditorStepRouteName('editor-complete')).toBe(true)
    expect(isEditorStepRouteName('projects')).toBe(false)
    expect(isEditorStepRouteName(undefined)).toBe(false)
  })

  it('allows script and blocks later routes when draft is empty', () => {
    expect(resolveFirstIncompleteEditorRoute(null)).toEqual({
      routeName: 'editor-script',
      message: '请先生成剧本，再进入下一步',
    })

    expect(resolveEditorRouteGuard('editor-script', null)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-settings', null)).toEqual({
      ok: false,
      redirectRouteName: 'editor-script',
      message: '请先生成剧本，再进入下一步',
    })
  })

  it('allows settings but blocks storyboard when script exists and settings are incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        generated: '已生成剧本',
        updatedAt: '2026-03-12 17:16',
      },
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-settings',
      message: '请至少创建一个角色设定后再进入分镜',
    })

    expect(resolveEditorRouteGuard('editor-settings', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-storyboard', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-settings',
      message: '请至少创建一个角色设定后再进入分镜',
    })
  })

  it('allows storyboard but blocks video when storyboard is incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        generated: '已生成剧本',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景 1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot()],
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-storyboard',
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })

    expect(resolveEditorRouteGuard('editor-storyboard', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-video', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-storyboard',
      message: '请先为所有可见分镜生成首帧后再进入视频生成',
    })
  })

  it('allows video but blocks dubbing when video is incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        generated: '已生成剧本',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景 1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [
        makeShot({
          imageUrl: 'mock-image://shot-1',
          status: 'success',
        }),
      ],
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-video',
      message: '请先为所有可见镜头生成视频后再进入配音',
    })

    expect(resolveEditorRouteGuard('editor-video', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-dubbing', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-video',
      message: '请先为所有可见镜头生成视频后再进入配音',
    })
  })

  it('allows dubbing but blocks complete when dubbing is incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        generated: '已生成剧本',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景 1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [
        makeShot({
          imageUrl: 'mock-image://shot-1',
          videoUrl: 'mock-video://shot-1',
          status: 'success',
        }),
      ],
      dubbing: makeDubbingDraft([
        {
          id: 'character-1',
          selectedVoiceId: 'voice-1',
          hidden: false,
          lines: [
            {
              id: 'character-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头 1',
              text: '对白',
              status: 'success',
            },
          ],
        },
      ]),
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-dubbing',
      message: '请至少生成一条配音后再进入完成页',
    })

    expect(resolveEditorRouteGuard('editor-dubbing', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-complete', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-dubbing',
      message: '请至少生成一条配音后再进入完成页',
    })
  })

  it('allows complete when all editor steps are satisfied', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        generated: '已生成剧本',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景 1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [
        makeShot({
          imageUrl: 'mock-image://shot-1',
          videoUrl: 'mock-video://shot-1',
          status: 'success',
        }),
      ],
      dubbing: makeDubbingDraft([
        {
          id: 'character-1',
          selectedVoiceId: 'voice-1',
          hidden: false,
          lines: [
            {
              id: 'character-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头 1',
              text: '对白',
              audioUrl: 'mock-audio://line-1',
              status: 'success',
            },
          ],
        },
      ]),
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toBeNull()
    expect(resolveEditorRouteGuard('editor-complete', draft)).toEqual({ ok: true })
  })
})
