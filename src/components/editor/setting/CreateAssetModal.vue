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
            <select v-model="form.type">
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
            <span>素材名称</span>
            <input v-model.trim="form.title" type="text" placeholder="例如：角色 / 男主" />
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
import {
  createEmptyCreateAssetForm,
  getCreateAssetFieldErrors,
  isCreateAssetFormDirty,
  type CreateAssetFieldErrors,
} from '@/features/editor/createAssetModalState'
import type { SettingAssetType } from '@/types/settingAsset'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  (e: 'submit', payload: { type: SettingAssetType; title: string; prompt: string }): void
}>()

const form = reactive(createEmptyCreateAssetForm())
const fieldErrors = ref<CreateAssetFieldErrors>({})
const invalidFlashNonce = ref(0)
const showCancelConfirm = ref(false)

const resetForm = (): void => {
  Object.assign(form, createEmptyCreateAssetForm())
  fieldErrors.value = {}
  invalidFlashNonce.value = 0
}

const isDirty = computed(() => isCreateAssetFormDirty(form))

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

const submit = (): void => {
  const nextErrors = getCreateAssetFieldErrors(form)
  fieldErrors.value = nextErrors

  if (Object.keys(nextErrors).length > 0) {
    invalidFlashNonce.value += 1
    return
  }

  emit('submit', {
    type: form.type,
    title: form.title.trim(),
    prompt: form.prompt.trim(),
  })

  close()
}
</script>
