import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import {
  buildScopedEditorExportPayload,
  buildScopedProjectArtifact,
  buildScopedProjectExportFileName,
  resolveExportScopeSteps,
} from './editorExportScopeState'

describe('editorExportScopeState', () => {
  it('resolves export scope steps cumulatively', () => {
    expect(resolveExportScopeSteps('script')).toEqual(['script'])
    expect(resolveExportScopeSteps('storyboard')).toEqual(['script', 'settings', 'storyboard'])
    expect(resolveExportScopeSteps('video')).toEqual(['script', 'settings', 'storyboard', 'video'])
    expect(resolveExportScopeSteps('complete')).toEqual(['script', 'settings', 'storyboard', 'video', 'dubbing'])
  })

  it('builds a scoped draft payload from script to the current storyboard step', () => {
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
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '镜头描述',
        characterIds: ['c-1'],
        sceneIds: [],
        propIds: [],
        videoUrl: 'video.mp4',
        videoPrompt: '推进镜头',
        dialogue: '对白内容',
        durationSeconds: 5,
        status: 'pending-review',
        referenceImages: [],
      },
    ]
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [],
      },
    ]

    const payload = buildScopedEditorExportPayload(draft, 'storyboard')

    expect(payload.steps).toEqual(['script', 'settings', 'storyboard'])
    expect(payload.draft.script?.content).toBe('剧本正文')
    expect(payload.draft.settingAssets).toHaveLength(1)
    expect(payload.draft.shots).toHaveLength(1)
    expect(payload.draft.shots?.[0]?.videoUrl).toBeUndefined()
    expect(payload.draft.dubbing).toBeUndefined()
  })

  it('wraps the scoped payload as a project artifact envelope', () => {
    const draft = createDefaultEditorDraft('project-2')
    const artifact = buildScopedProjectArtifact('project-2', draft, 'video')

    expect(artifact.artifact).toBe('project')
    expect(artifact.payload.currentStep).toBe('video')
    expect(artifact.payload.steps).toEqual(['script', 'settings', 'storyboard', 'video'])
    expect(buildScopedProjectExportFileName('project-2')).toBe('project-2-project.json')
  })

  it('keeps hidden dubbing cards in complete scoped project artifacts for draft recovery', () => {
    const draft = createDefaultEditorDraft('project-complete')
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [],
      },
      {
        id: 'card-2',
        selectedVoiceId: 'voice-2',
        hidden: true,
        lines: [],
      },
    ]

    const artifact = buildScopedProjectArtifact('project-complete', draft, 'complete')

    expect(artifact.payload.currentStep).toBe('complete')
    expect(artifact.payload.draft.dubbing?.cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
    expect(artifact.payload.draft.dubbing?.cards[1]?.hidden).toBe(true)
  })
})
