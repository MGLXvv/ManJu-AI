import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { voiceApi } from '@/api/voice.api'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceAsset } from '@/types/voice'

export const useVoicesStore = defineStore('voices', () => {
  const voices = ref<VoiceAsset[]>([])
  const keyword = ref('')
  const loading = ref(false)
  const hydrated = ref(false)

  const filteredVoices = computed(() => {
    const text = keyword.value.trim().toLocaleLowerCase()
    if (!text) {
      return voices.value
    }
    return voices.value.filter((voice) => voice.name.toLocaleLowerCase().includes(text))
  })

  const hydrate = async (): Promise<void> => {
    if (loading.value) {
      return
    }

    loading.value = true
    try {
      voices.value = await voiceApi.list()
      hydrated.value = true
    } finally {
      loading.value = false
    }
  }

  const setKeyword = (value: string): void => {
    keyword.value = value
  }

  const createVoice = async (payload: CreateVoiceAssetInput): Promise<VoiceAsset> => {
    const created = await voiceApi.create(payload)
    voices.value.unshift(created)
    return created
  }

  const updateVoice = async (id: string, patch: UpdateVoiceAssetInput): Promise<VoiceAsset | null> => {
    const updated = await voiceApi.update(id, patch)
    if (!updated) {
      return null
    }

    voices.value = voices.value.map((voice) => (voice.id === id ? updated : voice))
    return updated
  }

  const deleteVoice = async (id: string): Promise<void> => {
    await voiceApi.remove(id)
    voices.value = voices.value.filter((voice) => voice.id !== id)
  }

  return {
    voices,
    keyword,
    loading,
    hydrated,
    filteredVoices,
    hydrate,
    setKeyword,
    createVoice,
    updateVoice,
    deleteVoice,
  }
})
