<template>
  <footer class="script-action-bar">
    <div class="script-action-bar__left">
      <AppButton class="script-action-bar__btn" type="button" @click="$emit('save')">保存</AppButton>
      <AppButton class="script-action-bar__btn" type="button" @click="$emit('open-template')">模板</AppButton>
      <AppButton class="script-action-bar__btn script-action-bar__btn--danger" type="button" @click="$emit('delete')">删除</AppButton>
    </div>

    <div class="script-action-bar__right">
      <AppButton
        class="script-action-bar__btn script-action-bar__btn--generate"
        type="button"
        :disabled="!canGenerate || loading"
        @click="$emit('generate')"
      >
        {{ loading ? '生成中...' : '生成剧本' }}
      </AppButton>

      <AppButton class="script-action-bar__next" variant="primary" type="button" :disabled="!canNext" @click="$emit('next')">
        进入分镜
      </AppButton>
    </div>
  </footer>
</template>

<script setup lang="ts">
import AppButton from '@/components/app/AppButton.vue'

defineProps<{
  canGenerate: boolean
  canNext: boolean
  loading?: boolean
}>()

defineEmits<{
  (e: 'save'): void
  (e: 'open-template'): void
  (e: 'delete'): void
  (e: 'generate'): void
  (e: 'next'): void
}>()
</script>
