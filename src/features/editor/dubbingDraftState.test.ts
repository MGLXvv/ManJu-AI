import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { SettingAsset } from '@/types/settingAsset'
import type { Shot } from '@/types/editor'
import { buildDubbingDraftPatch, resolveDubbingCards } from './dubbingDraftState'

const makeCharacterAsset = (overrides: Partial<SettingAsset> = {}): SettingAsset => ({
  id: 'asset-char-1',
  type: 'character',
  title: '赵灵儿',
  roleName: '角色音色',
  prompt: '角色提示词',
  imageUrls: ['image-1'],
  candidateImages: [],
  selectedVoiceId: 'male-mid-deep',
  voiceOptions: [{ id: 'male-mid-deep', name: '浑厚男中音' }],
  status: 'ready',
  favorite: false,
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

const makeShot = (overrides: Partial<Shot> = {}): Shot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头1',
  description: '描述',
  characterIds: ['asset-char-1'],
  sceneIds: ['scene-1'],
  propIds: [],
  imageUrl: 'image-1',
  videoUrl: 'mock-video://shot-1/1',
  videoPrompt: '视频提示词',
  dialogue: '这段对白需要配音',
  durationSeconds: 10,
  voiceAssignments: [{ id: 'voice-1', characterId: 'asset-char-1', voice: '浑厚男中音' }],
  status: 'success',
  style: '国风漫画',
  ratio: '16:9',
  isLocked: false,
  isFavorite: false,
  referenceImages: [],
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

describe('dubbingDraftState', () => {
  it('resolves dubbing cards from character assets and shots', () => {
    const draft = createDefaultEditorDraft('project-1')
    draft.settingAssets = [makeCharacterAsset()]
    draft.shots = [makeShot()]

    const cards = resolveDubbingCards(draft)

    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({
      id: 'asset-char-1',
      title: '赵灵儿',
      selectedVoiceId: 'male-mid-deep',
    })
    expect(cards[0].lines).toHaveLength(1)
    expect(cards[0].lines[0]).toMatchObject({
      shotId: 'shot-1',
      shotLabel: '镜头1',
      text: '这段对白需要配音',
      status: 'idle',
    })
  })

  it('preserves saved dubbing card state and hidden cards', () => {
    const draft = createDefaultEditorDraft('project-1')
    draft.settingAssets = [makeCharacterAsset()]
    draft.shots = [makeShot()]
    draft.dubbing = {
      modelId: 'azure-tts',
      cards: [
        {
          id: 'asset-char-1',
          selectedVoiceId: 'narrator',
          hidden: true,
          lines: [
            {
              id: 'asset-char-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头1',
              text: '这段对白需要配音',
              audioUrl: 'mock-audio://1',
              status: 'success',
            },
          ],
        },
      ],
    }

    const cards = resolveDubbingCards(draft)

    expect(cards).toHaveLength(1)
    expect(cards[0].hidden).toBe(true)
    expect(cards[0].selectedVoiceId).toBe('narrator')
    expect(cards[0].lines[0].audioUrl).toBe('mock-audio://1')
    expect(cards[0].lines[0].status).toBe('success')
  })

  it('builds a stable dubbing draft patch from cards and model', () => {
    const patch = buildDubbingDraftPatch({
      modelId: 'index-tts',
      cards: [
        {
          id: 'asset-char-1',
          title: '赵灵儿',
          imageUrl: 'image-1',
          selectedVoiceId: 'male-mid-deep',
          voiceOptions: [{ id: 'male-mid-deep', name: '浑厚男中音' }],
          createdAt: '2026年3月12日 17:16',
          hidden: false,
          lines: [
            {
              id: 'asset-char-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头1',
              text: '这段对白需要配音',
              audioUrl: 'mock-audio://1',
              status: 'success',
            },
          ],
        },
      ],
    })

    expect(patch).toEqual({
      dubbing: {
        modelId: 'index-tts',
        cards: [
          {
            id: 'asset-char-1',
            selectedVoiceId: 'male-mid-deep',
            hidden: false,
            lines: [
              {
                id: 'asset-char-1-shot-1',
                shotId: 'shot-1',
                shotLabel: '镜头1',
                text: '这段对白需要配音',
                audioUrl: 'mock-audio://1',
                status: 'success',
              },
            ],
          },
        ],
      },
    })
  })
})
