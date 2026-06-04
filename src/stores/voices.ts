import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { VoiceAsset } from '@/types/voice'

const seedVoices: VoiceAsset[] = [
  { id: 'voice-1', name: '浑厚男中音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-2', name: '温柔女中音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-3', name: '童音女', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-4', name: '童音男', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-5', name: '清亮青年音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-6', name: '磁性旁白', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-7', name: '活泼少女音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-8', name: '冷静御姐音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
  { id: 'voice-9', name: '少年热血音', audioUrl: '', duration: 0, createdAt: '2026-03-12 17:16' },
]

export const useVoicesStore = defineStore('voices', () => {
  const voices = ref<VoiceAsset[]>(seedVoices)
  const keyword = ref('')

  const filteredVoices = computed(() => {
    const text = keyword.value.trim()
    if (!text) return voices.value
    return voices.value.filter((voice) => voice.name.includes(text))
  })

  const setKeyword = (value: string): void => {
    keyword.value = value
  }

  const createVoice = (payload: { name: string; audioUrl: string; duration: number }): void => {
    voices.value.unshift({
      id: `voice-${Date.now()}`,
      name: payload.name,
      audioUrl: payload.audioUrl,
      duration: payload.duration,
      createdAt: '2026-03-12 17:16',
    })
  }

  const updateVoice = (id: string, patch: Partial<VoiceAsset>): void => {
    voices.value = voices.value.map((voice) => (voice.id === id ? { ...voice, ...patch } : voice))
  }

  const deleteVoice = (id: string): void => {
    voices.value = voices.value.filter((voice) => voice.id !== id)
  }

  return {
    voices,
    keyword,
    filteredVoices,
    setKeyword,
    createVoice,
    updateVoice,
    deleteVoice,
  }
})
