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
  title: '角色1',
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
  title: '镜头1',
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
  storyboardReviewed: false,
  referenceImages: [],
  createdAt: '2026-03-12 17:16',
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
    outline: '',
    generated: '',
    storyboard: '',
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
      'editor-script-input',
      'editor-script-storyboard',
      'editor-settings',
      'editor-storyboard',
      'editor-video',
      'editor-dubbing',
      'editor-complete',
    ])
  })

  it('recognizes editor step route names', () => {
    expect(isEditorStepRouteName('editor-script-input')).toBe(true)
    expect(isEditorStepRouteName('editor-script-storyboard')).toBe(true)
    expect(isEditorStepRouteName('editor-complete')).toBe(true)
    expect(isEditorStepRouteName('projects')).toBe(false)
    expect(isEditorStepRouteName(undefined)).toBe(false)
  })

  it('allows only the input route when source text is empty', () => {
    expect(resolveFirstIncompleteEditorRoute(null)).toEqual({
      routeName: 'editor-script-input',
      message: '请先输入文案，再进入下一步',
    })

    expect(resolveEditorRouteGuard('editor-script-input', null)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-settings', null)).toEqual({
      ok: false,
      redirectRouteName: 'editor-script-input',
      message: '请先输入文案，再进入下一步',
    })
  })

  it('requires generated script before entering storyboard-text stage', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '',
        storyboard: '',
        updatedAt: '2026-03-12 17:16',
      },
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-script-input',
      message: '请先生成剧本，再进入下一步',
    })

    expect(resolveEditorRouteGuard('editor-script-input', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-script-storyboard', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-script-input',
      message: '请先生成剧本，再进入下一步',
    })
  })

  it('requires storyboard text before entering settings', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '',
        updatedAt: '2026-03-12 17:16',
      },
    })

    expect(resolveFirstIncompleteEditorRoute(draft)).toEqual({
      routeName: 'editor-script-storyboard',
      message: '请先生成剧本分镜，再进入下一步',
    })

    expect(resolveEditorRouteGuard('editor-script-storyboard', draft)).toEqual({ ok: true })
    expect(resolveEditorRouteGuard('editor-settings', draft)).toEqual({
      ok: false,
      redirectRouteName: 'editor-script-storyboard',
      message: '请先生成剧本分镜，再进入下一步',
    })
  })

  it('allows settings but blocks storyboard page when setting assets are incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
    })

    const blocked = resolveEditorRouteGuard('editor-storyboard', draft)
    expect(resolveEditorRouteGuard('editor-settings', draft)).toEqual({ ok: true })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.redirectRouteName).toBe('editor-settings')
    }
  })

  it('allows storyboard but blocks video when storyboard images are incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot()],
    })

    const blocked = resolveEditorRouteGuard('editor-video', draft)
    expect(resolveEditorRouteGuard('editor-storyboard', draft)).toEqual({ ok: true })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.redirectRouteName).toBe('editor-storyboard')
    }
  })

  it('blocks video route until all visible storyboard shots are manually marked complete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot({ imageUrl: 'mock-image://shot-1', status: 'success', storyboardReviewed: false })],
    })

    const blocked = resolveEditorRouteGuard('editor-video', draft)
    expect(resolveEditorRouteGuard('editor-storyboard', draft)).toEqual({ ok: true })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.redirectRouteName).toBe('editor-storyboard')
      expect(blocked.message).toBe('请先完成人工审核并标记所有可见分镜后再进入视频生成')
    }
  })

  it('allows video but blocks dubbing when videos are incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot({ imageUrl: 'mock-image://shot-1', status: 'success', storyboardReviewed: true })],
    })

    const blocked = resolveEditorRouteGuard('editor-dubbing', draft)
    expect(resolveEditorRouteGuard('editor-video', draft)).toEqual({ ok: true })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.redirectRouteName).toBe('editor-video')
    }
  })

  it('allows dubbing but blocks complete when dubbing is incomplete', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot({ imageUrl: 'mock-image://shot-1', videoUrl: 'mock-video://shot-1', status: 'success', storyboardReviewed: true, videoReviewed: true })],
      dubbing: makeDubbingDraft([
        {
          id: 'character-1',
          selectedVoiceId: 'voice-1',
          hidden: false,
          lines: [
            {
              id: 'character-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头1',
              text: '对白',
              status: 'success',
            },
          ],
        },
      ]),
    })

    const blocked = resolveEditorRouteGuard('editor-complete', draft)
    expect(resolveEditorRouteGuard('editor-dubbing', draft)).toEqual({ ok: true })
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.redirectRouteName).toBe('editor-dubbing')
    }
  })

  it('allows complete when all editor steps are satisfied', () => {
    const draft = makeDraft({
      script: {
        content: '原文',
        prompt: '提示词',
        outline: '',
        generated: '已生成剧本',
        storyboard: '已生成剧本分镜',
        updatedAt: '2026-03-12 17:16',
      },
      settingAssets: [
        makeSettingAsset({ id: 'character-1', type: 'character' }),
        makeSettingAsset({ id: 'scene-1', type: 'scene', title: '场景1' }),
      ],
      storyboardGenerationMode: 'image',
      shots: [makeShot({ imageUrl: 'mock-image://shot-1', videoUrl: 'mock-video://shot-1', status: 'success', storyboardReviewed: true, videoReviewed: true })],
      dubbing: makeDubbingDraft([
        {
          id: 'character-1',
          selectedVoiceId: 'voice-1',
          hidden: false,
          lines: [
            {
              id: 'character-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头1',
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
