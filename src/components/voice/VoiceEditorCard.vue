<template>
  <article class="voice-editor-card">
    <input v-model="nameProxy" class="voice-editor-card__input" type="text" placeholder="请输入音色名称" />

    <button type="button" class="voice-editor-card__upload" @click="triggerUpload">
      <FigmaIcon name="card-upload" :size="20" />
      <span>{{ fileLabel }}</span>
    </button>

    <div class="voice-editor-card__footer">
      <button v-if="showDelete" type="button" class="voice-editor-card__delete" @click="$emit('delete')">
        <FigmaIcon name="card-delete" :size="18" />
      </button>
      <div class="voice-editor-card__actions">
        <button type="button" class="voice-editor-card__ghost" @click="$emit('cancel')">取消</button>
        <button type="button" class="voice-editor-card__save" :disabled="saveDisabled" @click="handleSave">保存</button>
      </div>
    </div>

    <input ref="fileRef" class="voice-editor-card__file" type="file" accept="audio/*" @change="onFileChange" />
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

const props = defineProps<{
  modelValue: string
  audioUrl?: string
  fileName?: string
  showDelete?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', payload: { name: string; audioUrl: string; duration: number }): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const fileRef = ref<HTMLInputElement | null>(null)
const uploadedUrl = ref(props.audioUrl ?? '')
const uploadedName = ref(props.fileName ?? '')
const uploadedDuration = ref(0)

watch(
  () => props.audioUrl,
  (value) => {
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

  const objectUrl = URL.createObjectURL(file)
  uploadedUrl.value = objectUrl
  uploadedName.value = file.name
  uploadedDuration.value = await readAudioDuration(objectUrl)

  if (target) {
    target.value = ''
  }
}

const handleSave = (): void => {
  emit('save', {
    name: nameProxy.value.trim(),
    audioUrl: uploadedUrl.value,
    duration: uploadedDuration.value,
  })
}
</script>
