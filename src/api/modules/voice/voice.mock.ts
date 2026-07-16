import { delay, readLocal, writeLocal } from '@/api/local'
import { MOCK_MEDIA_AUDIO_DURATION_SECONDS, MOCK_MEDIA_AUDIO_URL } from '@/mocks/mockMedia'
import { mockVoices } from '@/mocks/voice.mock'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceApiContract, VoiceAsset } from './voice.types'

const VOICE_LIBRARY_KEY = 'amd.voices.library'

const ensureVoiceAudioMock = (voice: VoiceAsset): VoiceAsset => ({
  ...voice,
  audioUrl: voice.audioUrl || MOCK_MEDIA_AUDIO_URL,
  duration: voice.duration || MOCK_MEDIA_AUDIO_DURATION_SECONDS,
})

const cloneVoice = (voice: VoiceAsset): VoiceAsset => ensureVoiceAudioMock({ ...voice })

const getVoices = (): VoiceAsset[] => {
  const stored = readLocal<VoiceAsset[]>(VOICE_LIBRARY_KEY, [])
  if (!stored.length) {
    return mockVoices.map(cloneVoice)
  }
  return stored.map(cloneVoice)
}

const setVoices = (voices: VoiceAsset[]): void => writeLocal(VOICE_LIBRARY_KEY, voices.map(ensureVoiceAudioMock))

export const voiceMockApi: VoiceApiContract = {
  async list() {
    await delay()
    const voices = getVoices()
    setVoices(voices)
    return voices.map(cloneVoice)
  },

  async create(input: CreateVoiceAssetInput) {
    await delay(80)
    const nextVoice: VoiceAsset = ensureVoiceAudioMock({
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      audioUrl: input.audioUrl,
      audioMediaId: input.audioMediaId,
      duration: input.duration,
      createdAt: '2026-03-12 17:16',
    })
    const voices = [nextVoice, ...getVoices()]
    setVoices(voices)
    return cloneVoice(nextVoice)
  },

  async update(voiceId: string, input: UpdateVoiceAssetInput) {
    await delay(80)
    const voices = getVoices()
    const targetIndex = voices.findIndex((voice) => voice.id === voiceId)
    if (targetIndex < 0) {
      return null
    }

    const nextVoice: VoiceAsset = ensureVoiceAudioMock({
      ...voices[targetIndex],
      ...input,
      name: input.name?.trim() ?? voices[targetIndex].name,
    })
    voices.splice(targetIndex, 1, nextVoice)
    setVoices(voices)
    return cloneVoice(nextVoice)
  },

  async remove(voiceId: string) {
    await delay(80)
    setVoices(getVoices().filter((voice) => voice.id !== voiceId))
  },
}
