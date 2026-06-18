<template>
  <Teleport to="body">
    <div v-if="open" class="create-asset-modal">
      <div class="create-asset-modal__overlay" @click="requestClose"></div>
      <section class="create-asset-modal__dialog" role="dialog" aria-modal="true" aria-label="添加素材">
        <header class="create-asset-modal__header">
          <h2>添加素材</h2>
          <button type="button" aria-label="关闭" @click="requestClose">×</button>
        </header>

        <form class="create-asset-modal__body" @submit.prevent="submit">
          <label
            class="create-asset-modal__field"
            :class="{ 'is-invalid': fieldErrors.type, 'is-flash': fieldErrors.type }"
            :key="`type-${invalidFlashNonce}`"
          >
            <span>素材类型</span>
            <select v-model="form.type" @change="handleTypeChange">
              <option value="character">角色</option>
              <option value="scene">场景</option>
              <option value="prop">道具</option>
            </select>
          </label>

          <label
            class="create-asset-modal__field"
            :class="{ 'is-invalid': fieldErrors.title, 'is-flash': fieldErrors.title }"
            :key="`title-${invalidFlashNonce}`"
          >
            <span>{{ titleLabel }}</span>
            <input v-model.trim="form.title" type="text" :placeholder="titlePlaceholder" />
          </label>

          <label
            v-if="form.type === 'character'"
            class="create-asset-modal__field"
            :key="`roleName-${invalidFlashNonce}`"
          >
            <span>人设 / 身份</span>
            <input v-model.trim="form.roleName" type="text" placeholder="例如：冷面保镖 / 世家千金" />
          </label>

          <label
            v-if="form.type === 'character'"
            class="create-asset-modal__field"
            :key="`voice-${invalidFlashNonce}`"
          >
            <span>默认音色</span>
            <select v-model="form.voiceId">
              <option value="">不设置默认音色</option>
              <option v-for="option in voiceOptions" :key="option.id" :value="option.id">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label
            class="create-asset-modal__field"
            :class="{ 'is-invalid': fieldErrors.description, 'is-flash': fieldErrors.description }"
            :key="`description-${invalidFlashNonce}`"
          >
            <span>描述</span>
            <textarea v-model.trim="form.description" :placeholder="descriptionPlaceholder"></textarea>
          </label>

          <label
            class="create-asset-modal__field"
            :class="{ 'is-invalid': fieldErrors.prompt, 'is-flash': fieldErrors.prompt }"
            :key="`prompt-${invalidFlashNonce}`"
          >
            <span>提示词</span>
            <textarea v-model.trim="form.prompt" placeholder="请输入提示词"></textarea>
          </label>

          <button class="create-asset-modal__submit" type="submit">创建素材</button>
        </form>
      </section>

      <AppConfirmDialog
        :open="showCancelConfirm"
        title="确定放弃设置？"
        confirm-text="确定"
        cancel-text="取消"
        confirm-tone="primary"
        size="sm"
        center-title
        center-actions
        @confirm="confirmClose"
        @cancel="cancelCloseConfirm"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import type { VoiceOption } from '@/features/voice/voiceOptionState'
import {
  createSettingAssetForm,
  getSettingAssetFieldErrors,
  isSettingAssetFormDirty,
  sanitizeSettingAssetCreateInput,
  type SettingAssetFieldErrors,
  type SettingAssetFormInput,
} from '@/features/editor/settingAssetFormState'
import type { SettingAssetType } from '@/types/settingAsset'

interface Props {
  voiceOptions?: VoiceOption[]
}

const props = withDefaults(defineProps<Props>(), {
  voiceOptions: () => [],
})

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  (e: 'submit', payload: {
    type: SettingAssetType
    title: string
    roleName?: string
    description: string
    prompt: string
    voiceId?: string
    voiceName?: string
  }): void
}>()

const form = reactive<SettingAssetFormInput>(createSettingAssetForm())
const fieldErrors = ref<SettingAssetFieldErrors>({})
const invalidFlashNonce = ref(0)
const showCancelConfirm = ref(false)

const titleLabel = computed(() => {
  if (form.type === 'scene') return '场景名称'
  if (form.type === 'prop') return '道具名称'
  return '角色名称'
})

const titlePlaceholder = computed(() => {
  if (form.type === 'scene') return '例如：夜晚街道 / 主角卧室'
  if (form.type === 'prop') return '例如：长剑 / 古旧相机'
  return '例如：男主 / 女主'
})

const descriptionPlaceholder = computed(() => {
  if (form.type === 'scene') return '请输入场景描述'
  if (form.type === 'prop') return '请输入道具描述'
  return '请输入角色描述'
})

const selectedVoiceOption = computed(() => props.voiceOptions.find((option) => option.id === form.voiceId) ?? null)

const resetForm = (type: SettingAssetType = 'character'): void => {
  Object.assign(form, createSettingAssetForm(type))
  fieldErrors.value = {}
  invalidFlashNonce.value = 0
}

const isDirty = computed(() => isSettingAssetFormDirty(form))

watch(open, (value) => {
  if (value) {
    resetForm()
    showCancelConfirm.value = false
  }
})

const close = (): void => {
  showCancelConfirm.value = false
  open.value = false
}

const requestClose = (): void => {
  if (!isDirty.value) {
    close()
    return
  }

  showCancelConfirm.value = true
}

const confirmClose = (): void => {
  close()
}

const cancelCloseConfirm = (): void => {
  showCancelConfirm.value = false
}

const handleTypeChange = (): void => {
  resetForm(form.type)
}

const submit = (): void => {
  const nextErrors = getSettingAssetFieldErrors(form)
  fieldErrors.value = nextErrors

  if (Object.keys(nextErrors).length > 0) {
    invalidFlashNonce.value += 1
    return
  }

  const payload = sanitizeSettingAssetCreateInput(form)
  emit('submit', {
    type: payload.type,
    title: payload.title,
    roleName: payload.type === 'character' ? payload.roleName : undefined,
    description: payload.description,
    prompt: payload.prompt,
    voiceId: payload.type === 'character' ? payload.voiceId || undefined : undefined,
    voiceName: payload.type === 'character' ? selectedVoiceOption.value?.name : undefined,
  })

  close()
}
</script>
