import { mockVoices } from '@/mocks/voice.mock'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceAsset } from '@/types/voice'
import { delay, readLocal, writeLocal } from './local'

const VOICE_LIBRARY_KEY = 'amd.voices.library'

const cloneVoice = (voice: VoiceAsset): VoiceAsset => ({ ...voice })

const getVoices = (): VoiceAsset[] => {
  const stored = readLocal<VoiceAsset[]>(VOICE_LIBRARY_KEY, [])
  if (!stored.length) {
    return mockVoices.map(cloneVoice)
  }
  return stored.map(cloneVoice)
}

const setVoices = (voices: VoiceAsset[]): void => writeLocal(VOICE_LIBRARY_KEY, voices)

export const voiceApi = {
  async list(): Promise<VoiceAsset[]> {
    await delay()
    const voices = getVoices()
    setVoices(voices)
    return voices.map(cloneVoice)
  },

  async create(input: CreateVoiceAssetInput): Promise<VoiceAsset> {
    await delay(80)
    const nextVoice: VoiceAsset = {
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      audioUrl: input.audioUrl,
      duration: input.duration,
      createdAt: '2026-03-12 17:16',
    }
    const voices = [nextVoice, ...getVoices()]
    setVoices(voices)
    return cloneVoice(nextVoice)
  },

  async update(voiceId: string, input: UpdateVoiceAssetInput): Promise<VoiceAsset | null> {
    await delay(80)
    const voices = getVoices()
    const targetIndex = voices.findIndex((voice) => voice.id === voiceId)
    if (targetIndex < 0) {
      return null
    }

    const nextVoice: VoiceAsset = {
      ...voices[targetIndex],
      ...input,
      name: input.name?.trim() ?? voices[targetIndex].name,
    }
    voices.splice(targetIndex, 1, nextVoice)
    setVoices(voices)
    return cloneVoice(nextVoice)
  },

  async remove(voiceId: string): Promise<void> {
    await delay(80)
    setVoices(getVoices().filter((voice) => voice.id !== voiceId))
  },
}
