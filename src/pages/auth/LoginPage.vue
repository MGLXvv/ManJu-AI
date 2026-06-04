<template>
  <section class="auth-login-page" :style="heroStyle">
    <div class="auth-login-page__bg-group" aria-hidden="true">
      <div class="auth-login-page__hero"></div>
      <div class="auth-login-page__shade-all"></div>
      <div class="auth-login-page__shade-ellipse"></div>
    </div>
    <div class="auth-login-page__panel-wrap">
      <div class="auth-login-page__panel-stack" :class="{ 'has-third-party': Boolean(activeProvider) }">
        <AuthThirdPartyCard
          v-if="activeProvider"
          :provider="activeProvider"
          :visible="Boolean(activeProvider)"
          @close="activeProvider = null"
          @existing-login="onThirdPartyExistingLogin"
          @first-login="onThirdPartyFirstLogin"
        />
        <AuthFormCard
          v-model:mode="mode"
          v-model:account="account"
          v-model:secret="secret"
          v-model:agreed="agreed"
          :show-password="showPassword"
          @forgot="mode = 'reset'"
          @toggle-password="showPassword = !showPassword"
          @submit="onSubmit"
          @social-login="onSocialLogin"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import bg1 from '@/assets/auth/login-bg-1.png'
import bg2 from '@/assets/auth/login-bg-2.png'
import AuthFormCard, { type AuthMode } from '@/components/auth/AuthFormCard.vue'
import AuthThirdPartyCard from '@/components/auth/AuthThirdPartyCard.vue'
import { useAuthStore } from '@/stores/auth'
import type { ThirdPartyProvider } from '@/types/auth'

const mode = ref<AuthMode>('password')
const account = ref('')
const secret = ref('')
const agreed = ref(true)
const showPassword = ref(false)
const activeProvider = ref<ThirdPartyProvider | null>(null)
const authStore = useAuthStore()
const router = useRouter()

const heroCandidates = [bg1, bg2]
const heroIndex = Math.floor(Math.random() * heroCandidates.length)

const heroStyle = computed(() => ({
  '--auth-login-hero-image': `url("${heroCandidates[heroIndex]}")`,
}))

const onSubmit = async (): Promise<void> => {
  if (!agreed.value) {
    return
  }

  await authStore.login({
    mode: mode.value,
    account: account.value,
    secret: secret.value,
  })
  await router.push('/')
}

const onSocialLogin = (provider: ThirdPartyProvider): void => {
  activeProvider.value = activeProvider.value === provider ? null : provider
}

const onThirdPartyExistingLogin = async (): Promise<void> => {
  if (!activeProvider.value) {
    return
  }

  const result = await authStore.loginWithThirdParty({
    provider: activeProvider.value,
    firstLogin: false,
  })

  if (result.session) {
    await router.push('/')
  }
}

const onThirdPartyFirstLogin = (): void => {
  mode.value = 'register'
}
</script>
