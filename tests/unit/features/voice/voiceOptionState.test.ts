import { describe, expect, it } from 'vitest'
import type { VoiceAsset } from '@/types/voice'
import { mapVoiceAssetsToOptions, resolveVoiceOption } from '@/features/voice/voiceOptionState'

describe('voiceOptionState', () => {
  it('maps managed voice assets into reusable select options', () => {
    const options = mapVoiceAssetsToOptions([
      {
        id: 'voice-1',
        name: '浑厚男中音',
        audioUrl: 'mock://voice-1.wav',
        duration: 12,
        createdAt: '2026-03-12 17:16',
      } satisfies VoiceAsset,
    ])

    expect(options).toEqual([
      {
        id: 'voice-1',
        name: '浑厚男中音',
        label: '浑厚男中音',
        value: 'voice-1',
      },
    ])
  })

  it('resolves the configured voice option by id', () => {
    const option = resolveVoiceOption(
      [
        { id: 'voice-1', name: '浑厚男中音', label: '浑厚男中音', value: 'voice-1' },
        { id: 'voice-2', name: '温柔女中音', label: '温柔女中音', value: 'voice-2' },
      ],
      'voice-2',
    )

    expect(option?.name).toBe('温柔女中音')
  })
})
