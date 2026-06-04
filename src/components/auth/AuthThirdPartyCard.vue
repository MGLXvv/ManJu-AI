<template>
  <aside class="auth-third-party-card" :class="{ 'is-visible': visible }">
    <div class="auth-third-party-card__head">
      <div>
        <p class="auth-third-party-card__eyebrow">第三方登录</p>
        <h2 class="auth-third-party-card__title">{{ providerTitle }}</h2>
      </div>
      <button type="button" class="auth-third-party-card__close" aria-label="关闭第三方登录" @click="$emit('close')">×</button>
    </div>

    <div class="auth-third-party-card__qr">
      <div class="auth-third-party-card__qr-frame" aria-hidden="true">
        <div class="auth-third-party-card__qr-grid"></div>
      </div>
      <p class="auth-third-party-card__hint">使用{{ providerLabel }}扫码继续</p>
    </div>

    <div class="auth-third-party-card__actions">
      <button type="button" class="auth-third-party-card__action" @click="$emit('existing-login')">已绑定账号，直接登录</button>
      <button type="button" class="auth-third-party-card__action is-secondary" @click="$emit('first-login')">
        首次登录，去注册绑定
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThirdPartyProvider } from '@/types/auth'

const props = defineProps<{
  provider: ThirdPartyProvider
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'existing-login'): void
  (e: 'first-login'): void
}>()

const providerLabelMap: Record<ThirdPartyProvider, string> = {
  wechat: '微信',
  qq: 'QQ',
  alipay: '支付宝',
}

const providerLabel = computed(() => providerLabelMap[props.provider])
const providerTitle = computed(() => `${providerLabel.value}登录`)
</script>
