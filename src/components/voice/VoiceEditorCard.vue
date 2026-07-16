<template>
  <article class="voice-editor-card">
    <input v-model="nameProxy" class="voice-editor-card__input" type="text" placeholder="请输入音色名称" />

    <button type="button" class="voice-editor-card__upload" @click="triggerUpload">
      <FigmaIcon name="card-upload" :size="20" />
      <span>{{ fileLabel }}</span>
    </button>

    <div class="voice-editor-card__footer">
      <button v-if="showDelete" type="button" class="voice-editor-card__delete" @click="handleDelete">
        <FigmaIcon name="card-delete" :size="18" />
      </button>
      <div class="voice-editor-card__actions">
        <button type="button" class="voice-editor-card__ghost" @click="handleCancel">取消</button>
        <button type="button" class="voice-editor-card__save" :disabled="saveDisabled" @click="handleSave">保存</button>
      </div>
    </div>

    <input ref="fileRef" class="voice-editor-card__file" type="file" accept="audio/*" @change="onFileChange" />
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { createObjectUrlRegistry } from '@/features/shared/objectUrlRegistryState'
import type { VoiceEditorSavePayload } from '@/types/voice'

const props = defineProps<{
  modelValue: string
  audioUrl?: string
  fileName?: string
  showDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', payload: VoiceEditorSavePayload): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const previewUrlRegistry = createObjectUrlRegistry({
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
})
const fileRef = ref<HTMLInputElement | null>(null)
const uploadedUrl = ref(props.audioUrl ?? '')
const uploadedName = ref(props.fileName ?? '')
const uploadedDuration = ref(0)
const selectedFile = ref<File | null>(null)
let ownedPreviewUrl = ''
let selectionVersion = 0

const releaseOwnedPreview = (): void => {
  if (!ownedPreviewUrl) return
  const releasedUrl = ownedPreviewUrl
  ownedPreviewUrl = ''
  previewUrlRegistry.release(releasedUrl)
  if (uploadedUrl.value === releasedUrl) uploadedUrl.value = ''
}

const discardSelectedAudio = (): void => {
  selectionVersion += 1
  releaseOwnedPreview()
  selectedFile.value = null
  uploadedDuration.value = 0
}

watch(
  () => props.audioUrl,
  (value) => {
    if (value === ownedPreviewUrl) return
    discardSelectedAudio()
    uploadedUrl.value = value ?? ''
  },
)

watch(
  () => props.fileName,
  (value) => {
    uploadedName.value = value ?? ''
  },
)

const nameProxy = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const fileLabel = computed(() => uploadedName.value || '上传音频文件')
const saveDisabled = computed(() => !nameProxy.value.trim())

const triggerUpload = (): void => {
  fileRef.value?.click()
}

const readAudioDuration = (audioUrl: string): Promise<number> =>
  new Promise((resolve) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.src = audioUrl
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0)
    audio.onerror = () => resolve(0)
  })

const onFileChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  selectionVersion += 1
  const currentSelectionVersion = selectionVersion
  releaseOwnedPreview()
  const objectUrl = previewUrlRegistry.create(file)
  ownedPreviewUrl = objectUrl
  selectedFile.value = file
  uploadedUrl.value = objectUrl
  uploadedName.value = file.name
  uploadedDuration.value = 0
  if (target) target.value = ''

  const duration = await readAudioDuration(objectUrl)
  if (selectionVersion !== currentSelectionVersion || ownedPreviewUrl !== objectUrl) return
  uploadedDuration.value = duration
}

const handleSave = (): void => {
  emit('save', {
    name: nameProxy.value.trim(),
    audioUrl: uploadedUrl.value,
    duration: uploadedDuration.value,
    audioFile: selectedFile.value ?? undefined,
  })
}

const handleCancel = (): void => {
  discardSelectedAudio()
  emit('cancel')
}

const handleDelete = (): void => {
  discardSelectedAudio()
  emit('delete')
}

onBeforeUnmount(() => {
  selectionVersion += 1
  previewUrlRegistry.releaseAll()
  ownedPreviewUrl = ''
})
</script>
