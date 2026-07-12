<template>
  <section class="auth-login-page" :style="heroStyle">
    <div class="auth-login-page__bg-group" aria-hidden="true">
      <div class="auth-login-page__hero"></div>
      <div class="auth-login-page__shade-all"></div>
      <div class="auth-login-page__shade-ellipse"></div>
    </div>
    <div class="auth-login-page__panel-wrap">
      <Transition name="auth-modal">
        <div v-if="helperDialog" class="auth-login-page__helper-mask" @click="helperDialog = null">
          <div class="auth-login-page__helper-dialog" @click.stop>
            <div class="auth-login-page__helper-head">
              <h3>{{ helperDialog.title }}</h3>
              <button type="button" :aria-label="t('auth.aria.closeHelper')" @click="helperDialog = null">×</button>
            </div>
            <p>{{ helperDialog.body }}</p>
          </div>
        </div>
      </Transition>
      <Transition name="auth-toast">
        <div v-if="toastMessage" class="auth-login-page__toast-stack" aria-live="polite">
          <div class="auth-login-page__toast" :class="`is-${toastTone}`">
            {{ toastMessage }}
          </div>
        </div>
      </Transition>
      <div class="auth-login-page__panel-stack" :class="{ 'has-third-party': Boolean(activeProvider) }">
        <AuthThirdPartyCard
          v-if="activeProvider"
          :provider="activeProvider"
          :visible="Boolean(activeProvider)"
          :loading="thirdPartyLoading"
          :active-action="thirdPartyAction"
          :scan-state="thirdPartyScanState"
          @close="activeProvider = null"
          @existing-login="onThirdPartyExistingLogin"
          @first-login="onThirdPartyFirstLogin"
          @refresh="onRefreshThirdPartyScan"
        />
        <AuthFormCard
          v-model:mode="mode"
          v-model:account="currentAccount"
          v-model:username="currentUsername"
          v-model:password="currentPassword"
          v-model:code="currentCode"
          v-model:agreed="agreed"
          v-model:remember-account="rememberAccount"
          :show-password="showPassword"
          :show-code-login="codeLoginCapability.available"
          :loading="authStore.loading"
          :code-countdown="currentCountdown"
          :bind-provider-label="bindProviderLabel"
          :form-message="formMessage"
          :form-message-tone="formMessageTone"
          :show-register-entry="registerCapability.available"
          :show-forgot-password="resetPasswordCapability.available"
          :show-social-login="thirdPartyCapability.available"
          :errors="errors"
          @forgot="mode = 'reset'"
          @code-help="openHelper(t('auth.helper.codeTitle'), t('auth.helper.codeBody'))"
          @open-terms="openHelper(t('auth.helper.termsTitle'), t('auth.helper.termsBody'))"
          @open-privacy="openHelper(t('auth.helper.privacyTitle'), t('auth.helper.privacyBody'))"
          @toggle-password="showPassword = !showPassword"
          @request-code="onRequestCode"
          @submit="onSubmit"
          @social-login="onSocialLogin"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AUTH_ERROR, AUTH_STORAGE_KEYS } from '@/api/auth.api'
import { loadAuthHeroBackground, type AuthHeroModule } from '@/features/auth/authHeroBackground'
import AuthFormCard, { type AuthMode } from '@/components/auth/AuthFormCard.vue'
import AuthThirdPartyCard from '@/components/auth/AuthThirdPartyCard.vue'
import { resolveCapability, type CapabilityKey } from '@/features/capabilities/capabilityRegistry'
import { useAuthStore } from '@/stores/auth'
import type { ThirdPartyProvider } from '@/types/auth'

const readRememberedAccount = (): string => {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEYS.rememberedAccount)?.trim() ?? ''
  } catch {
    return ''
  }
}

const writeRememberedAccount = (account: string): void => {
  window.localStorage.setItem(AUTH_STORAGE_KEYS.rememberedAccount, account.trim())
}

const clearRememberedAccount = (): void => {
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.rememberedAccount)
}

const rememberedAccount = readRememberedAccount()
const { t } = useI18n()
const mode = ref<AuthMode>('password')
const agreed = ref(true)
const rememberAccount = ref(Boolean(rememberedAccount))
const showPassword = ref(false)
const activeProvider = ref<ThirdPartyProvider | null>(null)
const pendingBindProvider = ref<ThirdPartyProvider | null>(null)
const thirdPartyLoading = ref(false)
const thirdPartyAction = ref<'existing' | 'first' | null>(null)
const thirdPartyScanState = ref<'idle' | 'scanned' | 'confirmed' | 'expired'>('idle')
const authStore = useAuthStore()
const router = useRouter()

const passwordLoginCapability = resolveCapability('auth.passwordLogin')
const codeLoginCapability = resolveCapability('auth.codeLogin')
const registerCapability = resolveCapability('auth.register')
const resetPasswordCapability = resolveCapability('auth.resetPassword')
const thirdPartyCapability = resolveCapability('auth.thirdPartyLogin')

const passwordForm = reactive({ account: rememberedAccount, password: '' })
const codeForm = reactive({ account: '', code: '' })
const registerForm = reactive({ username: '', account: '', code: '', password: '' })
const resetForm = reactive({ username: '', account: '', code: '', password: '' })

const errors = ref<Partial<Record<'username' | 'account' | 'password' | 'code' | 'agree' | 'form', string>>>({})
const formMessage = ref('')
const formMessageTone = ref<'default' | 'error'>('default')
const toastMessage = ref('')
const toastTone = ref<'info' | 'success' | 'error'>('info')
const helperDialog = ref<{ title: string; body: string } | null>(null)
const countdowns = reactive({ code: 0, register: 0, reset: 0 })
const countdownTimers: Partial<Record<'code' | 'register' | 'reset', number>> = {}
const scanTimers: number[] = []
let toastTimer: number | null = null

const heroModules = import.meta.glob<AuthHeroModule>('../../assets/auth/login-bg-*.webp', { query: '?url' })
const heroLoaders = Object.values(heroModules)
const heroUrl = ref('')

const heroStyle = computed(() => (heroUrl.value ? { '--auth-login-hero-image': `url("${heroUrl.value}")` } : {}))

onMounted(async () => {
  heroUrl.value = (await loadAuthHeroBackground(heroLoaders)) ?? ''
})

const providerLabelMap = computed<Record<ThirdPartyProvider, string>>(() => ({
  wechat: t('auth.thirdParty.providerWechat'),
  qq: t('auth.thirdParty.providerQq'),
  alipay: t('auth.thirdParty.providerAlipay'),
}))

const bindProviderLabel = computed(() =>
  pendingBindProvider.value ? providerLabelMap.value[pendingBindProvider.value] : '',
)

const currentAccount = computed({
  get: () => {
    if (mode.value === 'code') return codeForm.account
    if (mode.value === 'register') return registerForm.account
    if (mode.value === 'reset') return resetForm.account
    return passwordForm.account
  },
  set: (value: string) => {
    if (mode.value === 'code') codeForm.account = value
    else if (mode.value === 'register') registerForm.account = value
    else if (mode.value === 'reset') resetForm.account = value
    else passwordForm.account = value
  },
})

const currentUsername = computed({
  get: () => (mode.value === 'register' ? registerForm.username : mode.value === 'reset' ? resetForm.username : ''),
  set: (value: string) => {
    if (mode.value === 'register') registerForm.username = value
    if (mode.value === 'reset') resetForm.username = value
  },
})

const currentPassword = computed({
  get: () => {
    if (mode.value === 'register') return registerForm.password
    if (mode.value === 'reset') return resetForm.password
    return passwordForm.password
  },
  set: (value: string) => {
    if (mode.value === 'register') registerForm.password = value
    else if (mode.value === 'reset') resetForm.password = value
    else passwordForm.password = value
  },
})

const currentCode = computed({
  get: () =>
    mode.value === 'code'
      ? codeForm.code
      : mode.value === 'register'
        ? registerForm.code
        : mode.value === 'reset'
          ? resetForm.code
          : '',
  set: (value: string) => {
    if (mode.value === 'code') codeForm.code = value
    else if (mode.value === 'register') registerForm.code = value
    else if (mode.value === 'reset') resetForm.code = value
  },
})

const currentCountdown = computed(() => {
  if (mode.value === 'code') return countdowns.code
  if (mode.value === 'register') return countdowns.register
  if (mode.value === 'reset') return countdowns.reset
  return 0
})

const setMessage = (message = '', tone: 'default' | 'error' = 'default'): void => {
  formMessage.value = message
  formMessageTone.value = tone
}

const clearToast = (): void => {
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
  toastMessage.value = ''
}

const showToast = (message: string, tone: 'info' | 'success' | 'error' = 'info'): void => {
  clearToast()
  toastMessage.value = message
  toastTone.value = tone
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, 3200)
}

const mapAuthError = (error: unknown, fallbackKey: string): string => {
  const rawMessage = error instanceof Error ? error.message.trim() : ''
  if (!rawMessage) {
    return t(fallbackKey)
  }

  const normalized = rawMessage.toLowerCase()

  if (normalized.includes('network') || normalized.includes('fetch')) return t('auth.error.network')
  if (normalized.includes('timeout')) return t('auth.error.timeout')
  if (rawMessage === AUTH_ERROR.INVALID_CREDENTIALS) return t('auth.error.invalidCredentials')
  if (rawMessage === AUTH_ERROR.ACCOUNT_NOT_FOUND) return t('auth.error.accountNotFound')
  if (rawMessage === AUTH_ERROR.INVALID_CODE) return t('auth.error.invalidCode')
  if (rawMessage === AUTH_ERROR.ACCOUNT_EXISTS) return t('auth.error.accountExists')
  if (rawMessage === AUTH_ERROR.ACCOUNT_MISMATCH) return t('auth.error.accountMismatch')
  if (rawMessage === AUTH_ERROR.CODE_RATE_LIMIT) return t('auth.error.codeRateLimit')
  if (normalized.includes('provider') || normalized.includes('third')) return t('auth.error.thirdPartyUnavailable')

  return t(fallbackKey)
}

const completeAndRedirect = async (message: string): Promise<void> => {
  showToast(message, 'success')
  await new Promise((resolve) => window.setTimeout(resolve, 520))
  await router.push('/')
}

const clearFeedback = (): void => {
  errors.value = {}
  setMessage('')
}

const openHelper = (title: string, body: string): void => {
  helperDialog.value = { title, body }
}

const clearScanTimers = (): void => {
  while (scanTimers.length > 0) {
    const timer = scanTimers.pop()
    if (timer) window.clearTimeout(timer)
  }
}

const startThirdPartyScanFlow = (): void => {
  clearScanTimers()
  thirdPartyScanState.value = 'idle'
  scanTimers.push(
    window.setTimeout(() => {
      thirdPartyScanState.value = 'scanned'
    }, 1600),
  )
  scanTimers.push(
    window.setTimeout(() => {
      thirdPartyScanState.value = 'confirmed'
    }, 3200),
  )
  scanTimers.push(
    window.setTimeout(() => {
      thirdPartyScanState.value = 'expired'
    }, 15000),
  )
}

const getFormSnapshot = (targetMode: AuthMode): { account: string; username: string } => {
  if (targetMode === 'password') return { account: passwordForm.account.trim(), username: '' }
  if (targetMode === 'code') return { account: codeForm.account.trim(), username: '' }
  if (targetMode === 'register') return { account: registerForm.account.trim(), username: registerForm.username.trim() }
  return { account: resetForm.account.trim(), username: resetForm.username.trim() }
}

const syncModeForms = (nextMode: AuthMode, prevMode: AuthMode): void => {
  const snapshot = getFormSnapshot(prevMode)

  if (nextMode === 'password') {
    if (snapshot.account) passwordForm.account = snapshot.account
    if (prevMode !== 'password') passwordForm.password = ''
    return
  }

  if (nextMode === 'code') {
    if (snapshot.account) codeForm.account = snapshot.account
    if (prevMode !== 'code') codeForm.code = ''
    return
  }

  if (nextMode === 'register') {
    if (snapshot.account) registerForm.account = snapshot.account
    if (snapshot.username && prevMode === 'reset') registerForm.username = snapshot.username
    if (prevMode !== 'register') {
      registerForm.code = ''
      registerForm.password = ''
    }
    return
  }

  if (snapshot.account) resetForm.account = snapshot.account
  if (snapshot.username && prevMode === 'register') resetForm.username = snapshot.username
  if (prevMode !== 'reset') {
    resetForm.code = ''
    resetForm.password = ''
  }
}

watch(mode, (nextMode, prevMode) => {
  clearFeedback()
  syncModeForms(nextMode, prevMode)
  if (nextMode !== 'register') pendingBindProvider.value = null
  thirdPartyLoading.value = false
  thirdPartyAction.value = null
})

watch(rememberAccount, (value) => {
  if (!value) {
    clearRememberedAccount()
  }
})

watch(activeProvider, (nextProvider) => {
  if (nextProvider) {
    startThirdPartyScanFlow()
    return
  }

  clearScanTimers()
  thirdPartyScanState.value = 'idle'
  thirdPartyLoading.value = false
  thirdPartyAction.value = null
})

const resolveModeCapability = (): CapabilityKey => {
  if (mode.value === 'code') return 'auth.codeLogin'
  if (mode.value === 'register') return 'auth.register'
  if (mode.value === 'reset') return 'auth.resetPassword'
  return 'auth.passwordLogin'
}

const checkCapability = (key: CapabilityKey): boolean => {
  const capability = resolveCapability(key)
  if (capability.available) return true
  showToast(capability.message, 'error')
  return false
}

const validate = (): boolean => {
  const nextErrors: Partial<Record<'username' | 'account' | 'password' | 'code' | 'agree' | 'form', string>> = {}

  if (mode.value === 'password') {
    if (!passwordForm.account.trim()) nextErrors.account = t('auth.validation.requiredAccount')
    if (!passwordForm.password.trim()) nextErrors.password = t('auth.validation.requiredPassword')
  }

  if (mode.value === 'code') {
    if (!codeForm.account.trim()) nextErrors.account = t('auth.validation.requiredPhone')
    if (!codeForm.code.trim()) nextErrors.code = t('auth.validation.requiredCode')
    else if (codeForm.code.trim().length < 4) nextErrors.code = t('auth.validation.invalidCode')
  }

  if (mode.value === 'register' || mode.value === 'reset') {
    const form = mode.value === 'register' ? registerForm : resetForm
    if (!form.username.trim()) nextErrors.username = t('auth.validation.requiredUsername')
    if (!form.account.trim()) nextErrors.account = t('auth.validation.requiredPhoneOrEmail')
    if (!form.code.trim()) nextErrors.code = t('auth.validation.requiredCode')
    else if (form.code.trim().length < 4) nextErrors.code = t('auth.validation.invalidCode')
    if (!form.password.trim())
      nextErrors.password =
        mode.value === 'register'
          ? t('auth.validation.requiredRegisterPassword')
          : t('auth.validation.requiredResetPassword')
    else if (form.password.trim().length < 6 || form.password.trim().length > 16)
      nextErrors.password = t('auth.validation.invalidPasswordLength')
  }

  if (!agreed.value) nextErrors.agree = t('auth.validation.agreeRequired')

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

const startCountdown = (key: 'code' | 'register' | 'reset'): void => {
  if (countdownTimers[key]) window.clearInterval(countdownTimers[key])

  countdowns[key] = 60
  countdownTimers[key] = window.setInterval(() => {
    countdowns[key] -= 1
    if (countdowns[key] <= 0 && countdownTimers[key]) {
      window.clearInterval(countdownTimers[key])
      countdownTimers[key] = undefined
      countdowns[key] = 0
    }
  }, 1000)
}

const onRequestCode = async (): Promise<void> => {
  clearFeedback()

  if (mode.value !== 'code' && mode.value !== 'register' && mode.value !== 'reset') return
  if (!checkCapability(resolveModeCapability())) return

  const account = currentAccount.value.trim()
  if (!account) {
    errors.value = {
      account: mode.value === 'code' ? t('auth.validation.requiredPhone') : t('auth.validation.requiredPhoneOrEmail'),
    }
    return
  }

  try {
    const result = await authStore.requestCode(account)
    const key = mode.value === 'code' ? 'code' : mode.value === 'register' ? 'register' : 'reset'
    startCountdown(key)
    showToast(t('auth.toast.codeSent', { code: result.code }), 'success')
  } catch (error) {
    showToast(mapAuthError(error, 'auth.error.requestCodeFallback'), 'error')
  }
}

const onSubmit = async (): Promise<void> => {
  clearFeedback()

  if (!checkCapability(resolveModeCapability())) return
  if (!validate()) return

  try {
    if (mode.value === 'password') {
      await authStore.loginByPassword({ account: passwordForm.account, password: passwordForm.password })
      if (rememberAccount.value) {
        writeRememberedAccount(passwordForm.account)
      } else {
        clearRememberedAccount()
      }
      await completeAndRedirect(t('auth.toast.loginSuccess'))
      return
    }

    if (mode.value === 'code') {
      await authStore.loginByCode({ account: codeForm.account, code: codeForm.code })
      await completeAndRedirect(t('auth.toast.loginSuccess'))
      return
    }

    if (mode.value === 'register') {
      await authStore.register({
        username: registerForm.username,
        account: registerForm.account,
        code: registerForm.code,
        password: registerForm.password,
        bindProvider: pendingBindProvider.value ?? undefined,
      })
      activeProvider.value = null
      pendingBindProvider.value = null
      await completeAndRedirect(t('auth.toast.registerSuccess'))
      return
    }

    await authStore.resetPassword({
      username: resetForm.username,
      account: resetForm.account,
      code: resetForm.code,
      password: resetForm.password,
    })
    clearRememberedAccount()
    rememberAccount.value = false
    passwordForm.account = resetForm.account
    passwordForm.password = ''
    mode.value = 'password'
    showToast(t('auth.toast.resetSuccess'), 'success')
  } catch (error) {
    showToast(mapAuthError(error, 'auth.error.fallback'), 'error')
  }
}

const onSocialLogin = (provider: ThirdPartyProvider): void => {
  if (!checkCapability('auth.thirdPartyLogin')) return
  activeProvider.value = activeProvider.value === provider ? null : provider
}

const onThirdPartyExistingLogin = async (): Promise<void> => {
  if (!checkCapability('auth.thirdPartyLogin')) return
  if (!activeProvider.value || thirdPartyLoading.value || thirdPartyScanState.value !== 'confirmed') return

  clearFeedback()
  thirdPartyLoading.value = true
  thirdPartyAction.value = 'existing'

  try {
    const result = await authStore.loginWithThirdParty({ provider: activeProvider.value, firstLogin: false })
    if (result.session) {
      await completeAndRedirect(
        t('auth.toast.thirdPartySuccess', { provider: providerLabelMap.value[activeProvider.value] }),
      )
    }
  } catch (error) {
    showToast(mapAuthError(error, 'auth.error.thirdPartyFallback'), 'error')
  } finally {
    thirdPartyLoading.value = false
    thirdPartyAction.value = null
  }
}

const onThirdPartyFirstLogin = async (): Promise<void> => {
  if (!checkCapability('auth.thirdPartyLogin') || !checkCapability('auth.register')) return
  if (!activeProvider.value || thirdPartyLoading.value || thirdPartyScanState.value !== 'confirmed') return

  thirdPartyLoading.value = true
  thirdPartyAction.value = 'first'
  await new Promise((resolve) => window.setTimeout(resolve, 260))
  pendingBindProvider.value = activeProvider.value
  mode.value = 'register'
  showToast(t('auth.formMessage.bindReady'), 'info')
  thirdPartyLoading.value = false
  thirdPartyAction.value = null
}

const onRefreshThirdPartyScan = (): void => {
  if (thirdPartyLoading.value || !activeProvider.value) return
  startThirdPartyScanFlow()
  showToast(t('auth.toast.qrRefreshed'), 'info')
}

onBeforeUnmount(() => {
  clearToast()
  clearScanTimers()
  Object.values(countdownTimers).forEach((timer) => {
    if (timer) window.clearInterval(timer)
  })
})
</script>
