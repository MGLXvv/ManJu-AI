<template>
  <section class="auth-card">
    <h1 class="auth-card__title">{{ titleMap[mode] }}</h1>

    <div class="auth-card__tabs" role="tablist" aria-label="登录方式">
      <div class="auth-card__login-tabs">
        <button
          type="button"
          class="auth-card__tab"
          :class="{ 'is-active': mode === 'password' }"
          @click="$emit('update:mode', 'password')"
        >
          账号登录
        </button>

        <span class="auth-card__tab-separator" aria-hidden="true"></span>

        <button
          type="button"
          class="auth-card__tab"
          :class="{ 'is-active': mode === 'code' }"
          @click="$emit('update:mode', 'code')"
        >
          验证码登录
        </button>
      </div>

      <button
        type="button"
        class="auth-card__register-link"
        :class="{ 'is-active': mode === 'register' }"
        @click="$emit('update:mode', 'register')"
      >
        立即注册
      </button>
    </div>

    <form class="auth-card__form" @submit.prevent="$emit('submit')">
      <label class="auth-card__field">
        <span>{{ accountLabel }}</span>
        <input :placeholder="accountPlaceholder" :value="account" @input="onInput('account', $event)" />
      </label>

      <label v-if="mode === 'password' || mode === 'register' || mode === 'reset'" class="auth-card__field">
        <div class="auth-card__field-head">
          <span>{{ passwordLabel }}</span>
          <button v-if="mode === 'password'" type="button" class="auth-card__link" @click="$emit('forgot')">忘记密码？</button>
        </div>
        <div class="auth-card__input-wrap">
          <input
            :type="showPassword ? 'text' : 'password'"
            :placeholder="passwordPlaceholder"
            :value="secret"
            @input="onInput('secret', $event)"
          />
          <button type="button" class="auth-card__icon-btn" @click="$emit('toggle-password')">
            <FigmaIcon v-if="showPassword" name="form-eye-on" :size="15" />
            <FigmaIcon v-else name="form-eye-off" :size="15" />
          </button>
        </div>
      </label>

      <label v-else class="auth-card__field">
        <div class="auth-card__field-head">
          <span>验证码</span>
          <button type="button" class="auth-card__link" @click.prevent>获取验证码</button>
        </div>
        <input placeholder="请输入验证码" :value="secret" @input="onInput('secret', $event)" />
      </label>

      <label class="auth-card__agree">
        <button
          type="button"
          class="auth-card__agree-toggle"
          :class="{ 'is-checked': agreed }"
          :aria-pressed="agreed"
          @click="$emit('update:agreed', !agreed)"
        >
          <FigmaIcon name="checkbox-checked" :size="12" class="auth-card__agree-icon" :class="{ 'is-visible': agreed }" />
        </button>
        <span>我同意 服务条款 与 隐私政策</span>
      </label>

      <button class="auth-card__submit" type="submit">{{ submitTextMap[mode] }}</button>
    </form>

    <AuthSocialRow />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import AuthSocialRow from './AuthSocialRow.vue'

export type AuthMode = 'password' | 'code' | 'register' | 'reset'

const props = withDefaults(
  defineProps<{
    mode: AuthMode
    account: string
    secret: string
    agreed: boolean
    showPassword?: boolean
  }>(),
  {
    showPassword: false,
  },
)

const emit = defineEmits<{
  (e: 'update:mode', value: AuthMode): void
  (e: 'update:account', value: string): void
  (e: 'update:secret', value: string): void
  (e: 'update:agreed', value: boolean): void
  (e: 'submit'): void
  (e: 'forgot'): void
  (e: 'toggle-password'): void
}>()

const titleMap: Record<AuthMode, string> = {
  password: '登录/注册',
  code: '登录/注册',
  register: '账号注册',
  reset: '修改密码',
}

const submitTextMap: Record<AuthMode, string> = {
  password: '登录',
  code: '登录',
  register: '注册账号',
  reset: '保存',
}

const accountLabel = computed(() => {
  if (props.mode === 'register' || props.mode === 'reset') {
    return '用户名'
  }
  if (props.mode === 'code') {
    return '手机号'
  }
  return '账号'
})

const accountPlaceholder = computed(() => {
  if (props.mode === 'register' || props.mode === 'reset') {
    return '请输入用户名'
  }
  if (props.mode === 'code') {
    return '请输入手机号'
  }
  return '手机号 / 邮箱 / 用户名'
})

const passwordLabel = computed(() => (props.mode === 'reset' ? '设置新密码' : '密码'))
const passwordPlaceholder = computed(() => (props.mode === 'reset' ? '设置新密码，6-16位字符' : '输入你的密码'))

const onInput = (field: 'account' | 'secret', event: Event): void => {
  const target = event.target as HTMLInputElement
  if (field === 'account') {
    emit('update:account', target.value)
  } else {
    emit('update:secret', target.value)
  }
}

</script>
