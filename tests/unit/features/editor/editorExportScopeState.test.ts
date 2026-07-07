import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { EditorDraft, Shot } from '@/types/editor'
import {
  buildScopedEditorExportPayload,
  buildScopedProjectArtifact,
  buildScopedProjectExportFileName,
  resolveExportScopeSteps,
} from '@/features/editor/editorExportScopeState'

const makeShot = (): Shot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  description: '镜头描述',
  characterIds: ['c-1'],
  sceneIds: [],
  propIds: [],
  imageUrl: 'edited-image.png',
  videoUrl: 'video.mp4',
  videoPrompt: '视频提示词',
  dialogue: '对白',
  durationSeconds: 5,
  voiceAssignments: [
    {
      id: 'voice-1',
      characterId: 'c-1',
      voiceId: 'voice-1',
      voiceName: '沉稳男声',
      voice: '沉稳男声',
    },
  ],
  status: 'success',
  style: '国风',
  ratio: '16:9',
  isHidden: false,
  isLocked: false,
  storyboardReviewed: true,
  referenceImages: [
    {
      id: 'ref-1',
      url: 'ref.png',
      label: '参考图',
      sourceShotId: 'shot-0',
    },
  ],
  editHistory: [
    {
      id: 'edit-1',
      prompt: '强化表情',
      selection: { x: 10, y: 10, width: 20, height: 20 },
      sourceImageUrl: 'source.png',
      resultImageUrl: 'edited-image.png',
      createdAt: '2026-03-12T09:00:00.000Z',
    },
  ],
  createdAt: '2026-03-12 17:16',
})

const makeDraft = (): EditorDraft => {
  const draft = createDefaultEditorDraft('project-1')
  draft.script.content = '剧本正文'
  draft.characters = [{ id: 'c-1', name: '角色 A', description: '角色描述' }]
  draft.settingAssets = [
    {
      id: 'asset-1',
      type: 'character',
      title: '角色 A',
      roleName: '主角',
      description: '角色描述',
      prompt: '角色提示词',
      imageUrls: [],
      status: 'ready',
      favorite: false,
      createdAt: '2026-03-12 17:16',
    },
  ]
  draft.storyboardGenerationMode = 'image'
  draft.shots = [makeShot()]
  draft.dubbing.cards = [
    {
      id: 'card-1',
      selectedVoiceId: 'voice-1',
      hidden: false,
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: '镜头 1',
          text: '第一句对白',
          audioUrl: 'line-1.wav',
          status: 'success',
        },
      ],
    },
    {
      id: 'card-2',
      selectedVoiceId: 'voice-2',
      hidden: true,
      lines: [],
    },
  ]

  return draft
}

describe('editorExportScopeState', () => {
  it('resolves export scope steps cumulatively', () => {
    expect(resolveExportScopeSteps('script')).toEqual(['script'])
    expect(resolveExportScopeSteps('settings')).toEqual(['script', 'settings'])
    expect(resolveExportScopeSteps('storyboard')).toEqual(['script', 'settings', 'storyboard'])
    expect(resolveExportScopeSteps('video')).toEqual(['script', 'settings', 'storyboard', 'video'])
    expect(resolveExportScopeSteps('complete')).toEqual(['script', 'settings', 'storyboard', 'video', 'dubbing'])
  })

  it('keeps script and setting data in settings scope, but excludes storyboard and dubbing', () => {
    const payload = buildScopedEditorExportPayload(makeDraft(), 'settings')

    expect(payload.steps).toEqual(['script', 'settings'])
    expect(payload.draft.script?.content).toBe('剧本正文')
    expect(payload.draft.settingAssets).toHaveLength(1)
    expect(payload.draft.shots).toBeUndefined()
    expect(payload.draft.dubbing).toBeUndefined()
  })

  it('keeps image edit history in storyboard scope and excludes video and dubbing fields', () => {
    const payload = buildScopedEditorExportPayload(makeDraft(), 'storyboard')
    const shot = payload.draft.shots?.[0]

    expect(payload.steps).toEqual(['script', 'settings', 'storyboard'])
    expect(shot?.imageUrl).toBe('edited-image.png')
    expect(shot?.editHistory).toHaveLength(1)
    expect(shot?.editHistory?.[0]?.prompt).toBe('强化表情')
    expect(shot?.videoUrl).toBeUndefined()
    expect(shot?.videoPrompt).toBeUndefined()
    expect(shot?.dialogue).toBeUndefined()
    expect(shot?.durationSeconds).toBeUndefined()
    expect(shot?.voiceAssignments).toBeUndefined()
    expect(payload.draft.dubbing).toBeUndefined()
  })

  it('includes video fields in video scope and excludes dubbing draft', () => {
    const payload = buildScopedEditorExportPayload(makeDraft(), 'video')
    const shot = payload.draft.shots?.[0]

    expect(payload.steps).toEqual(['script', 'settings', 'storyboard', 'video'])
    expect(shot?.videoUrl).toBe('video.mp4')
    expect(shot?.videoPrompt).toBe('视频提示词')
    expect(shot?.dialogue).toBe('对白')
    expect(shot?.durationSeconds).toBe(5)
    expect(shot?.voiceAssignments).toEqual(expect.any(Array))
    expect(payload.draft.dubbing).toBeUndefined()
  })

  it('includes full dubbing draft for dubbing and complete scope, including hidden cards', () => {
    const draft = makeDraft()
    const dubbingPayload = buildScopedEditorExportPayload(draft, 'dubbing')
    const completePayload = buildScopedProjectArtifact('project-1', draft, 'complete')

    expect(dubbingPayload.steps).toEqual(['script', 'settings', 'storyboard', 'video', 'dubbing'])
    expect(completePayload.payload.steps).toEqual(['script', 'settings', 'storyboard', 'video', 'dubbing'])
    expect(dubbingPayload.draft.dubbing?.cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(completePayload.payload.draft.dubbing?.cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(completePayload.payload.draft.dubbing?.cards[1]?.hidden).toBe(true)
  })

  it('deep clones nested shot export fields so exported payload does not mutate the draft', () => {
    const draft = makeDraft()
    const payload = buildScopedEditorExportPayload(draft, 'video')
    const exportedShot = payload.draft.shots?.[0]

    expect(exportedShot).toBeDefined()

    exportedShot!.referenceImages![0].label = 'changed'
    exportedShot!.voiceAssignments![0].voice = 'changed'
    exportedShot!.editHistory![0].selection.x = 99

    expect(draft.shots[0].referenceImages?.[0]?.label).toBe('参考图')
    expect(draft.shots[0].voiceAssignments?.[0]?.voice).toBe('沉稳男声')
    expect(draft.shots[0].editHistory?.[0]?.selection.x).toBe(10)
  })

  it('wraps the scoped payload as a project artifact envelope', () => {
    const draft = makeDraft()
    const artifact = buildScopedProjectArtifact('project-2', draft, 'video')

    expect(artifact.artifact).toBe('project')
    expect(artifact.payload.currentStep).toBe('video')
    expect(artifact.payload.steps).toEqual(['script', 'settings', 'storyboard', 'video'])
    expect(buildScopedProjectExportFileName('project-2')).toBe('project-2-project.json')
  })
})
