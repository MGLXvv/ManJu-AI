<template>
  <section class="auth-third-party-panel">
    <p class="auth-third-party-panel__title">第三方登录</p>

    <div class="auth-third-party-panel__body">
      <template v-if="status === 'waiting'">
        <div class="auth-third-party-panel__qr-box" aria-hidden="true">
          <svg viewBox="0 0 160 160" class="auth-third-party-panel__qr-svg">
            <rect width="160" height="160" rx="14" fill="#ffffff" />
            <rect x="14" y="14" width="38" height="38" fill="#111111" />
            <rect x="22" y="22" width="22" height="22" fill="#ffffff" />
            <rect x="108" y="14" width="38" height="38" fill="#111111" />
            <rect x="116" y="22" width="22" height="22" fill="#ffffff" />
            <rect x="14" y="108" width="38" height="38" fill="#111111" />
            <rect x="22" y="116" width="22" height="22" fill="#ffffff" />
            <rect x="64" y="22" width="14" height="14" fill="#111111" />
            <rect x="86" y="22" width="14" height="14" fill="#111111" />
            <rect x="64" y="44" width="14" height="14" fill="#111111" />
            <rect x="86" y="44" width="14" height="14" fill="#111111" />
            <rect x="64" y="66" width="14" height="14" fill="#111111" />
            <rect x="86" y="66" width="14" height="14" fill="#111111" />
            <rect x="108" y="66" width="14" height="14" fill="#111111" />
            <rect x="130" y="66" width="14" height="14" fill="#111111" />
            <rect x="42" y="66" width="14" height="14" fill="#111111" />
            <rect x="20" y="66" width="14" height="14" fill="#111111" />
            <rect x="64" y="88" width="14" height="14" fill="#111111" />
            <rect x="86" y="88" width="14" height="14" fill="#111111" />
            <rect x="108" y="88" width="14" height="14" fill="#111111" />
            <rect x="42" y="88" width="14" height="14" fill="#111111" />
            <rect x="20" y="88" width="14" height="14" fill="#111111" />
            <rect x="64" y="110" width="14" height="14" fill="#111111" />
            <rect x="86" y="110" width="14" height="14" fill="#111111" />
            <rect x="108" y="110" width="14" height="14" fill="#111111" />
            <rect x="130" y="110" width="14" height="14" fill="#111111" />
            <rect x="64" y="132" width="14" height="14" fill="#111111" />
            <rect x="108" y="132" width="14" height="14" fill="#111111" />
          </svg>
        </div>
        <p class="auth-third-party-panel__desc">使用{{ providerLabel }}扫码授权登录</p>
        <div class="auth-third-party-panel__mock-actions">
          <button type="button" class="auth-third-party-panel__mock-btn is-primary" @click="$emit('simulate-existing')">
            已绑定登录
          </button>
          <button type="button" class="auth-third-party-panel__mock-btn" @click="$emit('simulate-first-login')">
            首次登录
          </button>
        </div>
      </template>

      <template v-else>
        <div class="auth-third-party-panel__status-card">
          <div class="auth-third-party-panel__status-icon">✓</div>
          <p class="auth-third-party-panel__status-title">扫码成功</p>
          <p class="auth-third-party-panel__status-text">
            {{ status === 'needs-register' ? '首次登录，请在右侧完成账号注册' : `已通过${providerLabel}授权登录` }}
          </p>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThirdPartyProvider } from '@/types/auth'

const props = defineProps<{
  provider: ThirdPartyProvider
  status: 'waiting' | 'success' | 'needs-register'
}>()

defineEmits<{
  (e: 'simulate-existing'): void
  (e: 'simulate-first-login'): void
}>()

const providerLabelMap: Record<ThirdPartyProvider, string> = {
  wechat: '微信',
  qq: 'QQ',
  alipay: '支付宝',
}

const providerLabel = computed(() => providerLabelMap[props.provider])
</script>
