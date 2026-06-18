import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { useEditorStore } from './editor'

describe('editor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('updates matching shot voice assignments when saving dubbing card voice selections', () => {
    const store = useEditorStore()
    const draft = createDefaultEditorDraft('project-editor')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '描述 1',
        characterIds: ['character-1', 'character-2'],
        sceneIds: [],
        propIds: [],
        dialogue: '对白 1',
        voiceAssignments: [
          {
            id: 'voice-1',
            characterId: 'character-1',
            voiceId: 'voice-old',
            voiceName: '旧音色',
            voice: '旧音色',
          },
          {
            id: 'voice-2',
            characterId: 'character-2',
            voiceId: 'voice-other',
            voiceName: '其他音色',
            voice: '其他音色',
          },
        ],
        status: 'success',
      },
      {
        id: 'shot-2',
        index: 2,
        title: '镜头 2',
        description: '描述 2',
        characterIds: ['character-1'],
        sceneIds: [],
        propIds: [],
        dialogue: '对白 2',
        voiceAssignments: [],
        status: 'success',
      },
    ]
    store.draft = draft

    store.updateDubbingDraft({
      modelId: 'index-tts',
      cards: [
        {
          id: 'character-1',
          title: '角色 1',
          imageUrl: 'image-1',
          selectedVoiceId: 'voice-new',
          voiceOptions: [
            { id: 'voice-new', name: '新音色' },
            { id: 'voice-old', name: '旧音色' },
          ],
          createdAt: '2026-03-12 17:16',
          hidden: false,
          lines: [],
        },
      ],
    })

    expect(store.draft?.shots[0]?.voiceAssignments?.find((item) => item.characterId === 'character-1')).toMatchObject({
      characterId: 'character-1',
      voiceId: 'voice-new',
      voiceName: '新音色',
      voice: '新音色',
    })
    expect(store.draft?.shots[0]?.voiceAssignments?.find((item) => item.characterId === 'character-2')).toMatchObject({
      characterId: 'character-2',
      voiceId: 'voice-other',
      voiceName: '其他音色',
      voice: '其他音色',
    })
    expect(store.draft?.shots[1]?.voiceAssignments?.find((item) => item.characterId === 'character-1')).toMatchObject({
      characterId: 'character-1',
      voiceId: 'voice-new',
      voiceName: '新音色',
      voice: '新音色',
    })
  })
})
