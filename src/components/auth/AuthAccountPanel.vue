<template>
  <section class="auth-account-panel">
    <h1 v-if="mode === 'password' || mode === 'code'" class="auth-account-panel__title">登录/注册</h1>

    <div v-if="mode === 'password' || mode === 'code'" class="auth-account-panel__topbar" role="tablist" aria-label="登录方式">
      <div class="auth-account-panel__tabs">
        <button
          type="button"
          class="auth-account-panel__tab"
          :class="{ 'is-active': mode === 'password' }"
          @click="$emit('update:mode', 'password')"
        >
          账号登录
        </button>
        <span class="auth-account-panel__tab-separator" aria-hidden="true"></span>
        <button
          type="button"
          class="auth-account-panel__tab"
          :class="{ 'is-active': mode === 'code' }"
          @click="$emit('update:mode', 'code')"
        >
          验证码登录
        </button>
      </div>
      <button type="button" class="auth-account-panel__mode-link" @click="$emit('update:mode', 'register')">立即注册</button>
    </div>

    <div v-else class="auth-account-panel__standalone-head">
      <h2 class="auth-account-panel__standalone-title">{{ mode === 'register' ? '账号注册' : '修改密码' }}</h2>
    </div>

    <form class="auth-account-panel__form" @submit.prevent="submit">
      <label v-if="mode === 'register' || mode === 'reset'" class="auth-account-panel__field">
        <span>用户名</span>
        <input v-model.trim="username" type="text" placeholder="请输入用户名" />
      </label>

      <label class="auth-account-panel__field">
        <span>{{ accountLabel }}</span>
        <div class="auth-account-panel__input-wrap" :class="{ 'has-suffix': showCodeTriggerOnAccount }">
          <input v-model.trim="account" type="text" :placeholder="accountPlaceholder" />
          <button
            v-if="showCodeTriggerOnAccount"
            type="button"
            class="auth-account-panel__inline-btn"
            :disabled="codeCountdown > 0 || !account.trim()"
            @click="requestCode"
          >
            {{ codeButtonText }}
          </button>
        </div>
      </label>

      <label v-if="mode === 'code'" class="auth-account-panel__field">
        <div class="auth-account-panel__field-head">
          <span>验证码</span>
          <button type="button" class="auth-account-panel__link" :disabled="codeCountdown > 0 || !account.trim()" @click="requestCode">
            {{ codeButtonText }}
          </button>
        </div>
        <input v-model.trim="code" type="text" placeholder="请输入验证码" />
      </label>

      <label v-if="mode === 'password' || mode === 'register' || mode === 'reset'" class="auth-account-panel__field">
        <div class="auth-account-panel__field-head">
          <span>{{ passwordLabel }}</span>
          <button v-if="mode === 'password'" type="button" class="auth-account-panel__link" @click="$emit('update:mode', 'reset')">
            忘记密码？
          </button>
        </div>
        <div class="auth-account-panel__input-wrap has-toggle">
          <input
            v-model.trim="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="passwordPlaceholder"
          />
          <button type="button" class="auth-account-panel__toggle-btn" @click="showPassword = !showPassword">
            <FigmaIcon v-if="showPassword" name="form-eye-on" :size="16" />
            <FigmaIcon v-else name="form-eye-off" :size="16" />
          </button>
        </div>
      </label>

      <div v-if="mode === 'password'" class="auth-account-panel__row auth-account-panel__row--password">
        <label class="auth-account-panel__checkbox-line">
          <input v-model="rememberPassword" type="checkbox" />
          <span>记住密码</span>
        </label>
      </div>

      <div v-if="mode === 'code'" class="auth-account-panel__row auth-account-panel__row--code">
        <button type="button" class="auth-account-panel__ghost-link" @click.prevent>未收到验证码？</button>
      </div>

      <label v-if="mode === 'register' || mode === 'reset'" class="auth-account-panel__checkbox-line auth-account-panel__checkbox-line--agreement">
        <input v-model="agreed" type="checkbox" />
        <span>
          我已阅读并同意
          <em>《用户协议》</em>
          和
          <em>《隐私政策》</em>
        </span>
      </label>

      <button class="auth-account-panel__submit" type="submit" :disabled="authStore.loading">
        {{ submitText }}
      </button>

      <div class="auth-account-panel__footer-link">
        <template v-if="mode === 'register'">
          已有账号？
          <button type="button" class="auth-account-panel__ghost-link is-accent" @click="$emit('update:mode', 'password')">马上登录</button>
        </template>
        <template v-else-if="mode === 'reset'">
          <button type="button" class="auth-account-panel__ghost-link is-accent" @click="$emit('update:mode', 'password')">返回登录</button>
        </template>
        <template v-else>
          没有账号？
          <button type="button" class="auth-account-panel__ghost-link is-accent" @click="$emit('update:mode', 'register')">立即注册</button>
        </template>
      </div>
    </form>

    <div class="auth-account-panel__third-party">
      <div class="auth-account-panel__third-party-divider">
        <span></span>
        <em>或者</em>
        <span></span>
      </div>
      <div class="auth-account-panel__third-party-buttons">
        <button
          v-for="item in thirdPartyItems"
          :key="item.provider"
          type="button"
          class="auth-account-panel__third-party-btn"
          :class="{ 'is-active': activeThirdPartyProvider === item.provider }"
          :title="item.label"
          @click="$emit('select-third-party', item.provider)"
        >
          <FigmaIcon v-if="item.icon" :name="item.icon" :size="20" />
          <span v-else class="auth-account-panel__third-party-alipay">支</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'
import { useAuthStore } from '@/stores/auth'
import type { AuthMode, ThirdPartyProvider } from '@/types/auth'

const props = defineProps<{
  mode: AuthMode
  activeThirdPartyProvider?: ThirdPartyProvider | null
}>()

const emit = defineEmits<{
  (e: 'update:mode', mode: AuthMode): void
  (e: 'select-third-party', provider: ThirdPartyProvider): void
}>()

const thirdPartyItems: Array<{ provider: ThirdPartyProvider; label: string; icon?: FigmaIconName }> = [
  { provider: 'wechat', label: '微信登录', icon: 'social-wechat' },
  { provider: 'qq', label: 'QQ登录', icon: 'social-qq' },
  { provider: 'alipay', label: '支付宝登录' },
]

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const account = ref('')
const password = ref('')
const code = ref('')
const rememberPassword = ref(true)
const agreed = ref(true)
const showPassword = ref(false)
const codeCountdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const showCodeTriggerOnAccount = computed(() => props.mode === 'register' || props.mode === 'reset')

const accountLabel = computed(() => {
  if (props.mode === 'code') return '手机号'
  if (props.mode === 'register' || props.mode === 'reset') return '手机号 / 邮箱'
  return '账号'
})

const accountPlaceholder = computed(() => {
  if (props.mode === 'code') return '请输入手机号'
  if (props.mode === 'register' || props.mode === 'reset') return '请输入手机号或邮箱'
  return '手机号/邮箱/用户名'
})

const passwordLabel = computed(() => (props.mode === 'reset' ? '设置新密码：6-16位字符，包含字母和数字' : '密码'))
const passwordPlaceholder = computed(() => (props.mode === 'reset' ? '输入你的密码' : '输入你的密码'))
const codeButtonText = computed(() => (codeCountdown.value > 0 ? `(${codeCountdown.value}s后重发)` : '获取验证码'))

const submitText = computed(() => {
  switch (props.mode) {
    case 'register':
      return '注册账号'
    case 'reset':
      return '保存'
    default:
      return '登录'
  }
})

const clearTimer = (): void => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startCountdown = (): void => {
  clearTimer()
  codeCountdown.value = 60
  timer = setInterval(() => {
    if (codeCountdown.value <= 1) {
      clearTimer()
      codeCountdown.value = 0
      return
    }
    codeCountdown.value -= 1
  }, 1000)
}

const requestCode = async (): Promise<void> => {
  if (!account.value.trim() || codeCountdown.value > 0) return
  await authStore.requestCode(account.value.trim())
  startCountdown()
}

const submit = async (): Promise<void> => {
  if (props.mode === 'password') {
    if (!account.value.trim() || !password.value.trim()) return
    await authStore.login({ mode: 'password', account: account.value.trim(), secret: password.value.trim() })
    await router.push('/')
    return
  }

  if (props.mode === 'code') {
    if (!account.value.trim() || !code.value.trim()) return
    await authStore.login({ mode: 'code', account: account.value.trim(), secret: code.value.trim() })
    await router.push('/')
    return
  }

  if (!agreed.value || !username.value.trim() || !account.value.trim() || !password.value.trim()) {
    return
  }

  if (props.mode === 'register') {
    await authStore.register({
      username: username.value.trim(),
      account: account.value.trim(),
      secret: password.value.trim(),
    })
    await router.push('/')
    return
  }

  await authStore.resetPassword({
    username: username.value.trim(),
    account: account.value.trim(),
    secret: password.value.trim(),
  })
  emit('update:mode', 'password')
  password.value = ''
  code.value = ''
}

watch(
  () => props.mode,
  (mode) => {
    if (mode !== 'code') {
      code.value = ''
    }
    if (mode === 'password' || mode === 'code') {
      agreed.value = true
    }
  },
)

onBeforeUnmount(() => {
  clearTimer()
})
</script>
