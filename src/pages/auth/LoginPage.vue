<template>
  <section class="auth-login-page" :style="heroStyle">
    <div class="auth-login-page__bg-group" aria-hidden="true">
      <div class="auth-login-page__hero"></div>
      <div class="auth-login-page__shade-right"></div>
      <div class="auth-login-page__shade-all"></div>
      <div class="auth-login-page__shade-ellipse"></div>
    </div>
    <div class="auth-login-page__panel-wrap">
      <AuthFormCard
        v-model:mode="mode"
        v-model:account="account"
        v-model:secret="secret"
        v-model:agreed="agreed"
        :show-password="showPassword"
        @forgot="mode = 'reset'"
        @toggle-password="showPassword = !showPassword"
        @submit="onSubmit"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import bg1 from '@/assets/auth/login-bg-1.png'
import bg2 from '@/assets/auth/login-bg-2.png'
import AuthFormCard, { type AuthMode } from '@/components/auth/AuthFormCard.vue'

const mode = ref<AuthMode>('password')
const account = ref('')
const secret = ref('')
const agreed = ref(true)
const showPassword = ref(false)

const heroCandidates = [bg1, bg2]
const heroIndex = Math.floor(Math.random() * heroCandidates.length)

const heroStyle = computed(() => ({
  '--auth-login-hero-image': `url("${heroCandidates[heroIndex]}")`,
}))

const onSubmit = (): void => {
  // 占位：后续接入真实认证接口
  console.log('[auth submit]', {
    mode: mode.value,
    account: account.value,
    secret: secret.value,
    agreed: agreed.value,
  })
}
</script>
