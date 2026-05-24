<template>
  <section class="auth-login-page" :style="heroStyle">
    <div class="auth-login-page__bg-group" aria-hidden="true">
      <div class="auth-login-page__hero"></div>
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
import { useRouter } from 'vue-router'
import bg1 from '@/assets/auth/login-bg-1.png'
import bg2 from '@/assets/auth/login-bg-2.png'
import AuthFormCard, { type AuthMode } from '@/components/auth/AuthFormCard.vue'
import { useAuthStore } from '@/stores/auth'

const mode = ref<AuthMode>('password')
const account = ref('')
const secret = ref('')
const agreed = ref(true)
const showPassword = ref(false)
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
</script>
