import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { Shot } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import { buildDubbingDraftPatch, resolveDubbingCards, syncDubbingVoiceSelectionsToShots } from '@/features/editor/dubbingDraftState'

const makeCharacterAsset = (overrides: Partial<SettingAsset> = {}): SettingAsset => ({
  id: overrides.id ?? 'asset-char-1',
  type: 'character',
  title: overrides.title ?? 'Character A',
  roleName: overrides.roleName ?? 'Lead',
  description: overrides.description ?? 'Character description',
  prompt: overrides.prompt ?? 'Character prompt',
  imageUrls: overrides.imageUrls ?? ['image-1'],
  candidateImages: overrides.candidateImages ?? [],
  voiceId: overrides.voiceId,
  voiceName: overrides.voiceName,
  selectedVoiceId: overrides.selectedVoiceId ?? 'male-mid-deep',
  voiceOptions: overrides.voiceOptions ?? [{ id: 'male-mid-deep', name: 'Deep Male Voice' }],
  status: overrides.status ?? 'ready',
  favorite: overrides.favorite ?? false,
  createdAt: overrides.createdAt ?? '2026-03-12 17:16',
})

const makeShot = (overrides: Partial<Shot> = {}): Shot => ({
  id: 'shot-1',
  index: 1,
  title: 'Shot 1',
  description: 'Shot description',
  characterIds: ['asset-char-1'],
  sceneIds: ['scene-1'],
  propIds: [],
  imageUrl: 'image-1',
  videoUrl: 'mock-video://shot-1/1',
  videoPrompt: 'Video prompt',
  dialogue: 'This line needs dubbing',
  durationSeconds: 10,
  voiceAssignments: [
    {
      id: 'voice-1',
      characterId: 'asset-char-1',
      voice: 'Deep Male Voice',
    },
  ],
  status: 'success',
  style: 'Comic',
  ratio: '16:9',
  isLocked: false,
  storyboardReviewed: false,
  referenceImages: [],
  createdAt: '2026-03-12 17:16',
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
      title: 'Character A',
      selectedVoiceId: 'male-mid-deep',
    })
    expect(cards[0].lines).toHaveLength(1)
    expect(cards[0].lines[0]).toMatchObject({
      shotId: 'shot-1',
      shotLabel: 'Shot 1',
      text: 'This line needs dubbing',
      status: 'idle',
    })
  })

  it('prefers the character asset default voice id when no saved card override exists', () => {
    const draft = createDefaultEditorDraft('project-1')
    draft.settingAssets = [
      makeCharacterAsset({
        voiceId: 'voice-default',
        voiceName: 'Voice Default',
        selectedVoiceId: '',
        voiceOptions: [
          { id: 'voice-default', name: 'Voice Default' },
          { id: 'voice-alt', name: 'Voice Alt' },
        ],
      }),
    ]
    draft.shots = [makeShot({ voiceAssignments: [] })]

    const cards = resolveDubbingCards(draft)

    expect(cards[0]?.selectedVoiceId).toBe('voice-default')
  })

  it('prefers the existing shot assignment voice id over the setting default when no saved card override exists', () => {
    const draft = createDefaultEditorDraft('project-1')
    draft.settingAssets = [
      makeCharacterAsset({
        voiceId: 'voice-default',
        voiceName: 'Voice Default',
        selectedVoiceId: '',
        voiceOptions: [
          { id: 'voice-existing', name: 'Voice Existing' },
          { id: 'voice-default', name: 'Voice Default' },
        ],
      }),
    ]
    draft.shots = [
      makeShot({
        voiceAssignments: [
          {
            id: 'voice-1',
            characterId: 'asset-char-1',
            voiceId: 'voice-existing',
            voiceName: 'Voice Existing',
            voice: 'Voice Existing',
          },
        ],
      }),
    ]

    const cards = resolveDubbingCards(draft)

    expect(cards[0]?.selectedVoiceId).toBe('voice-existing')
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
              shotLabel: 'Shot 1',
              text: 'This line needs dubbing',
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
          title: 'Character A',
          imageUrl: 'image-1',
          selectedVoiceId: 'male-mid-deep',
          voiceOptions: [{ id: 'male-mid-deep', name: 'Deep Male Voice' }],
          createdAt: '2026-03-12 17:16',
          hidden: false,
          lines: [
            {
              id: 'asset-char-1-shot-1',
              shotId: 'shot-1',
              shotLabel: 'Shot 1',
              text: 'This line needs dubbing',
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
                shotLabel: 'Shot 1',
                text: 'This line needs dubbing',
                audioUrl: 'mock-audio://1',
                status: 'success',
              },
            ],
          },
        ],
      },
    })
  })

  it('preserves hidden card state inside dubbing draft patches', () => {
    const patch = buildDubbingDraftPatch({
      modelId: 'index-tts',
      cards: [
        {
          id: 'asset-char-1',
          title: 'Character A',
          imageUrl: 'image-1',
          selectedVoiceId: 'male-mid-deep',
          voiceOptions: [{ id: 'male-mid-deep', name: 'Deep Male Voice' }],
          createdAt: '2026-03-12 17:16',
          hidden: true,
          lines: [
            {
              id: 'asset-char-1-shot-1',
              shotId: 'shot-1',
              shotLabel: 'Shot 1',
              text: 'This line needs dubbing',
              status: 'failed',
            },
          ],
        },
      ],
    })

    expect(patch.dubbing.cards[0]).toMatchObject({
      id: 'asset-char-1',
      hidden: true,
    })
  })

  it('syncs the selected card voice to every matching shot assignment without touching other characters', () => {
    const nextShots = syncDubbingVoiceSelectionsToShots(
      [
        makeShot({
          id: 'shot-1',
          characterIds: ['asset-char-1', 'asset-char-2'],
          voiceAssignments: [
            {
              id: 'voice-a',
              characterId: 'asset-char-1',
              voiceId: 'voice-old',
              voiceName: 'Voice Old',
              voice: 'Voice Old',
            },
            {
              id: 'voice-b',
              characterId: 'asset-char-2',
              voiceId: 'voice-other',
              voiceName: 'Voice Other',
              voice: 'Voice Other',
            },
          ],
        }),
        makeShot({
          id: 'shot-2',
          characterIds: ['asset-char-1'],
          voiceAssignments: [],
        }),
      ],
      [
        {
          id: 'asset-char-1',
          title: 'Character A',
          imageUrl: 'image-1',
          selectedVoiceId: 'voice-new',
          voiceOptions: [
            { id: 'voice-new', name: 'Voice New' },
            { id: 'voice-old', name: 'Voice Old' },
          ],
          createdAt: '2026-03-12 17:16',
          hidden: false,
          lines: [],
        },
      ],
    )

    expect(nextShots[0]?.voiceAssignments?.find((item) => item.characterId === 'asset-char-1')).toMatchObject({
      characterId: 'asset-char-1',
      voiceId: 'voice-new',
      voiceName: 'Voice New',
      voice: 'Voice New',
    })
    expect(nextShots[0]?.voiceAssignments?.find((item) => item.characterId === 'asset-char-2')).toMatchObject({
      characterId: 'asset-char-2',
      voiceId: 'voice-other',
      voiceName: 'Voice Other',
      voice: 'Voice Other',
    })
    expect(nextShots[1]?.voiceAssignments?.find((item) => item.characterId === 'asset-char-1')).toMatchObject({
      characterId: 'asset-char-1',
      voiceId: 'voice-new',
      voiceName: 'Voice New',
      voice: 'Voice New',
    })
  })
})
