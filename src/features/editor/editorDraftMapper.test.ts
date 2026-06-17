import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { storyboardShotsMock, storyboardTagOptions } from '@/mocks/storyboard.mock'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import {
  buildDubbingDraftPatch,
  buildScriptDraftPatch,
  buildSettingDraftPatch,
  buildStoryboardDraftPatch,
  normalizeEditorDraft,
} from './editorDraftMapper'

describe('editorDraftMapper', () => {
  it('builds a script patch by merging onto the current script draft', () => {
    const draft = createDefaultEditorDraft('project-script')

    const patch = buildScriptDraftPatch(draft.script, {
      content: '脚本文案',
      generated: '生成剧本',
    })

    expect(patch.script.content).toBe('脚本文案')
    expect(patch.script.generated).toBe('生成剧本')
    expect(patch.script.prompt).toBe(draft.script.prompt)
  })

  it('builds setting and storyboard patches with persisted ids', () => {
    const asset: SettingAsset = {
      id: 'asset-1',
      type: 'character',
      title: '角色-男主',
      prompt: '沉稳克制',
      imageUrls: ['image-1'],
      candidateImages: ['image-1', 'image-2'],
      selectedVoiceId: 'male-mid-deep',
      voiceOptions: [{ id: 'male-mid-deep', name: '浑厚男中音' }],
      status: 'ready',
      favorite: true,
      createdAt: '2026年3月12日 17:16',
    }

    const settingPatch = buildSettingDraftPatch([asset])
    const storyboardPatch = buildStoryboardDraftPatch([storyboardShotsMock[0]!])

    expect(settingPatch.settingAssets[0]?.id).toBe('asset-1')
    expect(settingPatch.characters[0]?.name).toBe('角色-男主')
    expect(storyboardPatch.shots[0]?.characterIds[0]).toBe(storyboardTagOptions.characters[0]?.id)
    expect(storyboardPatch.shots[0]?.description).toBe(storyboardShotsMock[0]?.prompt)
  })

  it('normalizes a partial draft with default nested structures', () => {
    const normalized = normalizeEditorDraft('project-normalize', {
      projectId: 'project-normalize',
      script: {
        content: '已有内容',
        prompt: '',
        generated: '',
        updatedAt: '2026-06-16T00:00:00.000Z',
      },
      characters: [],
      scenes: [],
      props: [],
      settingAssets: [],
      storyboardGenerationMode: 'image',
      shots: [],
      dubbing: {
        modelId: '',
        cards: [],
      },
    })

    expect(normalized.projectId).toBe('project-normalize')
    expect(normalized.script.content).toBe('已有内容')
    expect(normalized.dubbing.cards).toEqual([])
    expect(Array.isArray(normalized.settingAssets)).toBe(true)
    expect(Array.isArray(normalized.shots)).toBe(true)
  })

  it('builds a dubbing patch preserving independent card rows', () => {
    const cards: DubbingRoleCardModel[] = [
      {
        id: 'role-1',
        title: '许红豆',
        imageUrl: 'image-1',
        selectedVoiceId: 'voice-1',
        voiceOptions: [{ id: 'voice-1', name: '温柔女中音' }],
        createdAt: '2026年3月12日 17:16',
        hidden: false,
        lines: [
          {
            id: 'line-1',
            shotId: 'shot-1',
            shotLabel: '镜头1',
            text: '今晚的风，比想象中更冷。',
            status: 'idle',
          },
        ],
      },
    ]

    const patch = buildDubbingDraftPatch({
      modelId: 'index-tts',
      cards,
    })

    expect(patch.dubbing.modelId).toBe('index-tts')
    expect(patch.dubbing.cards[0]?.lines[0]?.id).toBe('line-1')
  })
})
