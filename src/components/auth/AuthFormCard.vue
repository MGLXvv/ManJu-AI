<template>
  <section class="auth-card" :class="{ 'is-loading': loading }">
    <h1 class="auth-card__title">{{ titleText }}</h1>

    <div class="auth-card__tabs" role="tablist" :aria-label="t('auth.aria.loginMethods')">
      <div class="auth-card__login-tabs">
        <button
          type="button"
          class="auth-card__tab"
          :class="{ 'is-active': mode === 'password' }"
          :disabled="loading"
          @click="$emit('update:mode', 'password')"
        >
          {{ t('auth.mode.password') }}
        </button>

        <template v-if="showCodeLogin">
          <span class="auth-card__tab-separator" aria-hidden="true"></span>

          <button
            type="button"
            class="auth-card__tab"
            :class="{ 'is-active': mode === 'code' }"
            :disabled="loading"
            @click="$emit('update:mode', 'code')"
          >
            {{ t('auth.mode.code') }}
          </button>
        </template>
      </div>

      <button
        v-if="showRegisterEntry"
        type="button"
        class="auth-card__register-link"
        :class="{ 'is-active': mode === 'register' }"
        :disabled="loading"
        @click="$emit('update:mode', 'register')"
      >
        {{ t('auth.action.registerNow') }}
      </button>
    </div>

    <form class="auth-card__form" @submit.prevent="$emit('submit')">
      <p v-if="bindProviderLabel" class="auth-card__bind-tip">
        {{ t('auth.bindTip', { provider: bindProviderLabel }) }}
      </p>

      <label v-if="needsUsername" class="auth-card__field">
        <span>{{ t('auth.field.username') }}</span>
        <input
          :placeholder="t('auth.placeholder.username')"
          :value="username"
          :disabled="loading"
          @input="onInput('username', $event)"
        />
        <small v-if="errors.username" class="auth-card__field-error">{{ errors.username }}</small>
      </label>

      <label class="auth-card__field">
        <span>{{ accountLabel }}</span>
        <input
          :placeholder="accountPlaceholder"
          :value="account"
          :disabled="loading"
          @input="onInput('account', $event)"
        />
        <small v-if="errors.account" class="auth-card__field-error">{{ errors.account }}</small>
      </label>

      <label v-if="mode === 'password'" class="auth-card__field">
        <div class="auth-card__field-head">
          <span>{{ t('auth.field.password') }}</span>
          <button
            v-if="showForgotPassword"
            type="button"
            class="auth-card__link"
            :disabled="loading"
            @click="$emit('forgot')"
          >
            {{ t('auth.action.forgotPassword') }}
          </button>
        </div>
        <div class="auth-card__input-wrap">
          <input
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('auth.placeholder.password')"
            :value="password"
            :disabled="loading"
            @input="onInput('password', $event)"
          />
          <button
            type="button"
            class="auth-card__icon-btn"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPassword"
            :disabled="loading"
            @click="$emit('toggle-password')"
          >
            <FigmaIcon v-if="showPassword" name="tool-view" :size="30" />
            <FigmaIcon v-else name="tool-view-off" :size="30" />
          </button>
        </div>
        <small v-if="errors.password" class="auth-card__field-error">{{ errors.password }}</small>
      </label>

      <label v-if="needsCode" class="auth-card__field">
        <div class="auth-card__field-head">
          <span>{{ t('auth.field.code') }}</span>
          <button
            type="button"
            class="auth-card__code-btn"
            :disabled="loading || codeCountdown > 0"
            @click="$emit('request-code')"
          >
            {{ codeButtonText }}
          </button>
        </div>
        <input
          :placeholder="t('auth.placeholder.code')"
          :value="code"
          :disabled="loading"
          @input="onInput('code', $event)"
        />
        <button
          v-if="mode === 'code'"
          type="button"
          class="auth-card__inline-link"
          :disabled="loading"
          @click="$emit('code-help')"
        >
          {{ t('auth.action.codeHelp') }}
        </button>
        <small v-if="errors.code" class="auth-card__field-error">{{ errors.code }}</small>
      </label>

      <label v-if="needsPasswordField" class="auth-card__field">
        <div class="auth-card__field-head">
          <span>{{ passwordLabel }}</span>
        </div>
        <div class="auth-card__input-wrap">
          <input
            :type="showPassword ? 'text' : 'password'"
            :placeholder="passwordPlaceholder"
            :value="password"
            :disabled="loading"
            @input="onInput('password', $event)"
          />
          <button
            type="button"
            class="auth-card__icon-btn"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :aria-pressed="showPassword"
            :disabled="loading"
            @click="$emit('toggle-password')"
          >
            <FigmaIcon v-if="showPassword" name="tool-view" :size="30" />
            <FigmaIcon v-else name="tool-view-off" :size="30" />
          </button>
        </div>
        <small v-if="errors.password" class="auth-card__field-error">{{ errors.password }}</small>
      </label>

      <label v-if="mode === 'password'" class="auth-card__remember">
        <button
          type="button"
          class="auth-card__remember-toggle"
          :class="{ 'is-checked': rememberAccount }"
          :aria-pressed="rememberAccount"
          :disabled="loading"
          @click="$emit('update:rememberAccount', !rememberAccount)"
        >
          <FigmaIcon
            name="checkbox-checked"
            :size="14"
            class="auth-card__agree-icon"
            :class="{ 'is-visible': rememberAccount }"
          />
        </button>
        <span>记住账号</span>
      </label>

      <label class="auth-card__agree">
        <button
          type="button"
          class="auth-card__agree-toggle"
          :class="{ 'is-checked': agreed }"
          :aria-pressed="agreed"
          :disabled="loading"
          @click="$emit('update:agreed', !agreed)"
        >
          <FigmaIcon
            name="checkbox-checked"
            :size="14"
            class="auth-card__agree-icon"
            :class="{ 'is-visible': agreed }"
          />
        </button>
        <span>
          {{ t('auth.action.agreePrefix') }}
          <button type="button" class="auth-card__text-link" :disabled="loading" @click="$emit('open-terms')">
            {{ t('auth.agree.terms') }}
          </button>
          {{ ` ${t('auth.action.and')} ` }}
          <button type="button" class="auth-card__text-link" :disabled="loading" @click="$emit('open-privacy')">
            {{ t('auth.agree.privacy') }}
          </button>
        </span>
      </label>
      <small v-if="errors.agree" class="auth-card__field-error auth-card__field-error--inline">{{
        errors.agree
      }}</small>
      <p v-if="formMessage" class="auth-card__form-message" :class="{ 'is-error': formMessageTone === 'error' }">
        {{ formMessage }}
      </p>

      <button class="auth-card__submit" type="submit" :disabled="loading">
        {{ submitButtonText }}
      </button>
    </form>

    <AuthSocialRow v-if="showSocialLogin" :disabled="loading" @select="$emit('social-login', $event)" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { ThirdPartyProvider } from '@/types/auth'
import AuthSocialRow from './AuthSocialRow.vue'

export type AuthMode = 'password' | 'code' | 'register' | 'reset'

type AuthFieldKey = 'username' | 'account' | 'password' | 'code' | 'agree' | 'form'

const props = withDefaults(
  defineProps<{
    mode: AuthMode
    account: string
    username?: string
    password: string
    code?: string
    agreed: boolean
    rememberAccount?: boolean
    showPassword?: boolean
    showCodeLogin?: boolean
    loading?: boolean
    codeCountdown?: number
    bindProviderLabel?: string
    formMessage?: string
    formMessageTone?: 'default' | 'error'
    showRegisterEntry?: boolean
    showForgotPassword?: boolean
    showSocialLogin?: boolean
    errors?: Partial<Record<AuthFieldKey, string>>
  }>(),
  {
    username: '',
    code: '',
    rememberAccount: false,
    showPassword: false,
    showCodeLogin: true,
    loading: false,
    codeCountdown: 0,
    bindProviderLabel: '',
    formMessage: '',
    formMessageTone: 'default',
    showRegisterEntry: true,
    showForgotPassword: true,
    showSocialLogin: true,
    errors: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:mode', value: AuthMode): void
  (e: 'update:account', value: string): void
  (e: 'update:username', value: string): void
  (e: 'update:password', value: string): void
  (e: 'update:code', value: string): void
  (e: 'update:agreed', value: boolean): void
  (e: 'update:rememberAccount', value: boolean): void
  (e: 'submit'): void
  (e: 'forgot'): void
  (e: 'code-help'): void
  (e: 'open-terms'): void
  (e: 'open-privacy'): void
  (e: 'toggle-password'): void
  (e: 'social-login', value: ThirdPartyProvider): void
  (e: 'request-code'): void
}>()

const { t } = useI18n()

const needsUsername = computed(() => props.mode === 'register' || props.mode === 'reset')
const needsCode = computed(() => props.mode === 'code' || props.mode === 'register' || props.mode === 'reset')
const needsPasswordField = computed(() => props.mode === 'register' || props.mode === 'reset')

const titleText = computed(() => {
  if (props.mode === 'register') return t('auth.title.register')
  if (props.mode === 'reset') return t('auth.title.reset')
  return t('auth.title.loginRegister')
})

const accountLabel = computed(() => {
  if (props.mode === 'code') return t('auth.field.phone')
  if (props.mode === 'register' || props.mode === 'reset') return t('auth.field.phoneOrEmail')
  return t('auth.field.account')
})

const accountPlaceholder = computed(() => {
  if (props.mode === 'code') return t('auth.placeholder.phone')
  if (props.mode === 'register' || props.mode === 'reset') return t('auth.placeholder.phoneOrEmail')
  return t('auth.placeholder.account')
})

const passwordLabel = computed(() => (props.mode === 'reset' ? t('auth.field.newPassword') : t('auth.field.password')))
const passwordPlaceholder = computed(() =>
  props.mode === 'reset' ? t('auth.placeholder.resetPassword') : t('auth.placeholder.registerPassword'),
)

const submitButtonText = computed(() => {
  if (props.mode === 'register') return t('auth.action.register')
  if (props.mode === 'reset') return t('auth.action.save')
  return t('auth.action.login')
})

const codeButtonText = computed(() =>
  props.codeCountdown > 0
    ? t('auth.action.requestCodeRetry', { count: props.codeCountdown })
    : t('auth.action.requestCode'),
)

const onInput = (field: 'account' | 'username' | 'password' | 'code', event: Event): void => {
  const target = event.target as HTMLInputElement
  if (field === 'account') {
    emit('update:account', target.value)
    return
  }

  if (field === 'username') {
    emit('update:username', target.value)
    return
  }

  if (field === 'password') {
    emit('update:password', target.value)
    return
  }

  emit('update:code', target.value.replace(/\D/g, '').slice(0, 6))
}
</script>
