<template>
  <Teleport to="body">
    <div v-if="open" class="create-asset-modal">
      <div class="create-asset-modal__overlay" @click="close"></div>
      <section class="create-asset-modal__dialog" role="dialog" aria-modal="true" aria-label="添加资产">
        <header class="create-asset-modal__header">
          <h2>添加资产</h2>
          <button type="button" aria-label="关闭" @click="close">×</button>
        </header>

        <form class="create-asset-modal__body" @submit.prevent="submit">
          <label>
            <span>资产类型</span>
            <select v-model="form.type">
              <option value="character">角色</option>
              <option value="scene">场景</option>
              <option value="prop">道具</option>
            </select>
          </label>

          <label>
            <span>资产名称</span>
            <input v-model.trim="form.title" type="text" placeholder="例如：角色-男主" />
          </label>

          <label>
            <span>提示词</span>
            <textarea v-model.trim="form.prompt" placeholder="请输入提示词"></textarea>
          </label>

          <button class="create-asset-modal__submit" type="submit">创建资产</button>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { SettingAssetType } from '@/types/settingAsset'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  (e: 'submit', payload: { type: SettingAssetType; title: string; prompt: string }): void
}>()

const form = reactive({
  type: 'character' as SettingAssetType,
  title: '',
  prompt: '',
})

watch(open, (value) => {
  if (value) {
    form.type = 'character'
    form.title = ''
    form.prompt = ''
  }
})

const close = (): void => {
  open.value = false
}

const submit = (): void => {
  if (!form.title.trim()) {
    return
  }
  emit('submit', {
    type: form.type,
    title: form.title.trim(),
    prompt: form.prompt.trim() || 'masterpiece, best quality, detailed lighting, vivid colors',
  })
}
</script>
