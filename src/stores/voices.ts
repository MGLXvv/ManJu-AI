import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { voiceApi } from '@/api/voice.api'
import { mediaBlobRepository, mediaUploadService } from '@/services/media'
import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceAsset, VoiceEditorSavePayload } from '@/types/voice'

interface PreparedVoiceWrite<T> {
  payload: T
  uploadedMediaId?: string
}

const restoreVoiceAudio = async (voice: VoiceAsset): Promise<VoiceAsset> => {
  if (!voice.audioMediaId) return voice
  const audioUrl = await mediaBlobRepository.resolveUrl(voice.audioMediaId)
  return audioUrl ? { ...voice, audioUrl } : voice
}

const prepareCreateVoice = async (
  input: VoiceEditorSavePayload,
): Promise<PreparedVoiceWrite<CreateVoiceAssetInput>> => {
  const { audioFile, ...payload } = input
  if (!audioFile) return { payload }
  const uploaded = await mediaUploadService.uploadFile(audioFile, {
    targetType: 'voice-audio',
    targetId: 'voice-new',
    kind: 'audio',
  })
  return {
    payload: { ...payload, audioUrl: uploaded.url, audioMediaId: uploaded.mediaId },
    uploadedMediaId: uploaded.mediaId,
  }
}

const prepareUpdateVoice = async (
  voiceId: string,
  input: VoiceEditorSavePayload,
): Promise<PreparedVoiceWrite<UpdateVoiceAssetInput>> => {
  const { audioFile, ...payload } = input
  if (!audioFile) return { payload }
  const uploaded = await mediaUploadService.uploadFile(audioFile, {
    targetType: 'voice-audio',
    targetId: voiceId,
    kind: 'audio',
  })
  return {
    payload: { ...payload, audioUrl: uploaded.url, audioMediaId: uploaded.mediaId },
    uploadedMediaId: uploaded.mediaId,
  }
}

export const useVoicesStore = defineStore('voices', () => {
  const voices = ref<VoiceAsset[]>([])
  const keyword = ref('')
  const loading = ref(false)
  const hydrated = ref(false)

  const filteredVoices = computed(() => {
    const text = keyword.value.trim().toLocaleLowerCase()
    if (!text) return voices.value
    return voices.value.filter((voice) => voice.name.toLocaleLowerCase().includes(text))
  })

  const hydrate = async (): Promise<void> => {
    if (loading.value) return
    loading.value = true
    try {
      voices.value = await Promise.all((await voiceApi.list()).map(restoreVoiceAudio))
      hydrated.value = true
    } finally {
      loading.value = false
    }
  }

  const setKeyword = (value: string): void => {
    keyword.value = value
  }

  const createVoice = async (input: VoiceEditorSavePayload): Promise<VoiceAsset> => {
    const prepared = await prepareCreateVoice(input)
    try {
      const created = await voiceApi.create(prepared.payload)
      const hydratedVoice = await restoreVoiceAudio(created)
      voices.value.unshift(hydratedVoice)
      return hydratedVoice
    } catch (error) {
      if (prepared.uploadedMediaId) await mediaBlobRepository.remove(prepared.uploadedMediaId)
      throw error
    }
  }

  const updateVoice = async (id: string, input: VoiceEditorSavePayload): Promise<VoiceAsset | null> => {
    const previousMediaId = voices.value.find((voice) => voice.id === id)?.audioMediaId
    const prepared = await prepareUpdateVoice(id, input)
    try {
      const updated = await voiceApi.update(id, prepared.payload)
      if (!updated) {
        if (prepared.uploadedMediaId) await mediaBlobRepository.remove(prepared.uploadedMediaId)
        return null
      }
      const hydratedVoice = await restoreVoiceAudio(updated)
      voices.value = voices.value.map((voice) => (voice.id === id ? hydratedVoice : voice))
      if (previousMediaId && previousMediaId !== hydratedVoice.audioMediaId) {
        await mediaBlobRepository.remove(previousMediaId)
      }
      return hydratedVoice
    } catch (error) {
      if (prepared.uploadedMediaId) await mediaBlobRepository.remove(prepared.uploadedMediaId)
      throw error
    }
  }

  const deleteVoice = async (id: string): Promise<void> => {
    const mediaId = voices.value.find((voice) => voice.id === id)?.audioMediaId
    await voiceApi.remove(id)
    voices.value = voices.value.filter((voice) => voice.id !== id)
    if (mediaId) await mediaBlobRepository.remove(mediaId)
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
