<template>
  <div v-if="message" class="system-message-modal">
    <div class="system-message-modal__overlay" @click="$emit('close')"></div>
    <div class="system-message-modal__dialog">
      <header class="system-message-modal__header">
        <strong>{{ message.title }}查看详情</strong>
        <button type="button" @click="$emit('close')">×</button>
      </header>

      <div class="system-message-modal__body">
        <p class="system-message-modal__content">{{ message.content }}</p>

        <dl class="system-message-modal__meta">
          <div>
            <dt>平台</dt>
            <dd>{{ message.platform }}</dd>
          </div>
          <div>
            <dt>登录方式</dt>
            <dd>{{ message.loginMethod }}</dd>
          </div>
          <div>
            <dt>参考登录地</dt>
            <dd>{{ message.location }}</dd>
          </div>
          <div>
            <dt>登录时间</dt>
            <dd>{{ message.loginTime }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SystemMessageItem } from '@/types/system'

defineProps<{
  message: SystemMessageItem | null
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>
