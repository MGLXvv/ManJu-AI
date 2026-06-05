<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <RouterLink class="auth-layout__brand" to="/">
        <span class="auth-layout__brand-glow">ManJu AI</span>
        <span class="auth-layout__brand-text">ManJu AI</span>
      </RouterLink>
      <div class="auth-layout__lang-wrap">
        <button class="auth-layout__lang" type="button" :aria-expanded="langOpen" @click="langOpen = !langOpen">
          <span>{{ activeLanguage.label }}</span>
          <span class="auth-layout__lang-arrow">▼</span>
        </button>
        <Transition name="auth-lang">
          <div v-if="langOpen" class="auth-layout__lang-menu">
            <button
              v-for="item in languageOptions"
              :key="item.value"
              type="button"
              class="auth-layout__lang-option"
              :class="{ 'is-active': item.value === activeLanguage.value }"
              @click="selectLanguage(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </Transition>
      </div>
    </header>
    <main class="auth-layout__body">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { setAppLocale } from '@/i18n'
import type { AppLocale } from '@/i18n/messages'

const { t, locale } = useI18n()
const langOpen = ref(false)

const languageOptions = computed<Array<{ value: AppLocale; label: string }>>(() => [
  { value: 'zh-CN', label: t('auth.language.zhCN') },
  { value: 'en-US', label: t('auth.language.enUS') },
  { value: 'ja-JP', label: t('auth.language.jaJP') },
])

const activeLanguage = computed(() => languageOptions.value.find((item) => item.value === locale.value) ?? languageOptions.value[0])

const selectLanguage = (value: AppLocale): void => {
  setAppLocale(value)
  langOpen.value = false
}
</script>
