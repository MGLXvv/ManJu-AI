<template>
  <article class="resource-editor-card" :class="[`resource-editor-card--${localType}`]">
    <header class="resource-editor-card__head">
      <template v-if="mode === 'create'">
        <label class="resource-editor-card__type-wrap">
          <select v-model="localType" class="resource-editor-card__type">
            <option value="character">角色</option>
            <option value="scene">场景</option>
          </select>
        </label>
      </template>
      <template v-else>
        <span>{{ localType === 'character' ? '角色' : '场景' }}</span>
      </template>
    </header>

    <div class="resource-editor-card__body">
      <div class="resource-editor-card__name-label">输入名称</div>
      <input v-model="name" class="resource-editor-card__name-input" type="text" placeholder="请输入名称" />

      <div class="resource-editor-card__preview">
        <img v-if="imageUrl" :src="imageUrl" :alt="name || '资源预览'" />
      </div>

      <label class="resource-editor-card__field">
        <span>提示词</span>
        <textarea v-model="prompt" placeholder="请输入提示词"></textarea>
      </label>

      <label v-if="localType === 'character'" class="resource-editor-card__field resource-editor-card__field--voice">
        <span>角色音色</span>
        <div class="resource-editor-card__voice-row">
          <AssetVoiceSelect v-model="selectedVoiceId" :options="voiceOptions" />
        </div>
      </label>

      <div class="resource-editor-card__actions">
        <button type="button" @click="fillGeneratedImage">生成图片</button>
        <button type="button" @click="triggerUpload">上传图片</button>
      </div>

      <div class="resource-editor-card__footer">
        <button type="button" class="resource-editor-card__save" @click="handleSave">保存</button>
        <button v-if="mode === 'edit'" type="button" class="resource-editor-card__delete" @click="$emit('delete')">删除</button>
        <button type="button" class="resource-editor-card__cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>

    <input ref="uploadRef" class="resource-editor-card__file" type="file" accept="image/*" @change="onFileChange" />
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AssetVoiceSelect from '@/components/editor/setting/AssetVoiceSelect.vue'
import type { ResourceAsset, ResourceAssetType } from '@/types/resource'
import type { VoiceOption } from '@/types/settingAsset'

const props = defineProps<{
  mode: 'create' | 'edit'
  asset?: ResourceAsset
  tab: 'creative' | 'subject'
  defaultSource: 'created' | 'favorite' | 'official'
}>()

const emit = defineEmits<{
  (e: 'save', payload: {
    type: ResourceAssetType
    name: string
    prompt: string
    imageUrl: string
    selectedVoiceId?: string
  }): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const voiceOptions: VoiceOption[] = props.asset?.voiceOptions ?? [
  { id: 'male-mid', name: '浑厚男中音' },
  { id: 'female-soft', name: '温柔女中音' },
  { id: 'girl-lively', name: '活泼少女音' },
]

const localType = ref<ResourceAssetType>(props.asset?.type ?? 'character')
const name = ref(props.asset?.name ?? '')
const prompt = ref(props.asset?.prompt ?? '')
const imageUrl = ref(props.asset?.imageUrl ?? '')
const selectedVoiceId = ref(props.asset?.selectedVoiceId ?? voiceOptions[0]?.id ?? '')
const uploadRef = ref<HTMLInputElement | null>(null)

const createPlaceholderImage = (label: string, colorA: string, colorB: string): string => {
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${colorA}" /><stop offset="100%" stop-color="${colorB}" /></linearGradient></defs>
      <rect width="320" height="220" fill="url(#g)" />
      <circle cx="250" cy="56" r="24" fill="rgba(255,255,255,0.14)" />
      <text x="24" y="194" fill="rgba(255,255,255,0.88)" font-family="Segoe UI, PingFang SC, Microsoft YaHei, sans-serif" font-size="22" font-weight="700">${label}</text>
    </svg>`,
  )
  return `data:image/svg+xml;charset=UTF-8,${encoded}`
}

const fillGeneratedImage = (): void => {
  imageUrl.value =
    localType.value === 'character'
      ? createPlaceholderImage(name.value || '角色', '#5a7f28', '#93c637')
      : createPlaceholderImage(name.value || '场景', '#8a6c28', '#d9af3c')
}

const triggerUpload = (): void => {
  uploadRef.value?.click()
}

const onFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      imageUrl.value = reader.result
    }
  }
  reader.readAsDataURL(file)
  if (target) target.value = ''
}

const handleSave = (): void => {
  emit('save', {
    type: localType.value,
    name: name.value.trim() || (localType.value === 'character' ? '未命名角色' : '未命名场景'),
    prompt: prompt.value.trim(),
    imageUrl: imageUrl.value,
    selectedVoiceId: localType.value === 'character' ? selectedVoiceId.value : undefined,
  })
}
</script>
