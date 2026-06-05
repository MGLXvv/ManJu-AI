<template>
  <aside class="auth-third-party-card" :class="{ 'is-visible': visible }">
    <div class="auth-third-party-card__head">
      <div>
        <p class="auth-third-party-card__eyebrow">{{ t('auth.thirdParty.eyebrow') }}</p>
        <h2 class="auth-third-party-card__title">{{ t('auth.thirdParty.title', { provider: providerLabel }) }}</h2>
      </div>
      <button type="button" class="auth-third-party-card__close" :aria-label="t('auth.aria.closeThirdParty')" @click="$emit('close')">×</button>
    </div>

    <div class="auth-third-party-card__status">
      <span class="auth-third-party-card__provider-chip">{{ providerLabel }}</span>
      <span class="auth-third-party-card__scan-badge" :class="`is-${scanState}`">{{ scanStateLabel }}</span>
      <p class="auth-third-party-card__status-text">{{ scanStateText }}</p>
    </div>

    <div class="auth-third-party-card__qr">
      <div class="auth-third-party-card__qr-frame" :class="{ 'is-expired': scanState === 'expired' }" aria-hidden="true">
        <div class="auth-third-party-card__qr-grid"></div>
      </div>
      <p class="auth-third-party-card__hint">{{ qrHint }}</p>
      <button type="button" class="auth-third-party-card__refresh" :disabled="loading" @click="$emit('refresh')">
        {{ scanState === 'expired' ? t('auth.action.rescan') : t('auth.action.refreshQr') }}
      </button>
    </div>

    <div class="auth-third-party-card__actions">
      <button
        type="button"
        class="auth-third-party-card__action"
        :class="{ 'is-loading': loading && activeAction === 'existing' }"
        :disabled="loading || scanState !== 'confirmed'"
        @click="$emit('existing-login')"
      >
        <span>{{ t('auth.action.directLogin') }}</span>
        <small>{{ loading && activeAction === 'existing' ? t('auth.thirdParty.actionDesc.existingLoading') : t('auth.thirdParty.actionDesc.existing') }}</small>
      </button>
      <button
        type="button"
        class="auth-third-party-card__action is-secondary"
        :class="{ 'is-loading': loading && activeAction === 'first' }"
        :disabled="loading || scanState !== 'confirmed'"
        @click="$emit('first-login')"
      >
        <span>{{ t('auth.action.firstLoginBind') }}</span>
        <small>{{ loading && activeAction === 'first' ? t('auth.thirdParty.actionDesc.firstLoading') : t('auth.thirdParty.actionDesc.first') }}</small>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ThirdPartyProvider } from '@/types/auth'

const props = defineProps<{
  provider: ThirdPartyProvider
  visible: boolean
  loading?: boolean
  activeAction?: 'existing' | 'first' | null
  scanState?: 'idle' | 'scanned' | 'confirmed' | 'expired'
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'existing-login'): void
  (e: 'first-login'): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()

const providerLabel = computed(() => {
  if (props.provider === 'qq') return t('auth.thirdParty.providerQq')
  if (props.provider === 'alipay') return t('auth.thirdParty.providerAlipay')
  return t('auth.thirdParty.providerWechat')
})

const scanStateLabel = computed(() => t(`auth.thirdParty.scanState.${props.scanState ?? 'idle'}`))
const scanStateText = computed(() => t(`auth.thirdParty.scanText.${props.scanState ?? 'idle'}`))
const qrHint = computed(() => t(`auth.thirdParty.qrHint.${props.scanState ?? 'idle'}`, { provider: providerLabel.value }))
</script>
