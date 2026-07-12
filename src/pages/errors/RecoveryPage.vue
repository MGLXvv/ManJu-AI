<template>
  <main class="recovery-page">
    <section class="recovery-page__card" role="status" aria-live="polite">
      <div class="recovery-page__code">{{ code }}</div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <div class="recovery-page__actions">
        <button class="recovery-page__button recovery-page__button--primary" type="button" @click="goPrimary">
          {{ primaryLabel }}
        </button>
        <button class="recovery-page__button" type="button" @click="reloadPage">重新加载</button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    code?: string
    title: string
    description: string
    primaryLabel?: string
    primaryRouteName?: string
  }>(),
  {
    code: 'ERROR',
    primaryLabel: '返回项目列表',
    primaryRouteName: 'projects',
  },
)

const router = useRouter()

const goPrimary = async (): Promise<void> => {
  try {
    await router.push({ name: props.primaryRouteName })
  } catch {
    window.location.assign('/')
  }
}

const reloadPage = (): void => {
  window.location.reload()
}
</script>

<style scoped>
.recovery-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(145deg, #f7f5ff 0%, #f3f7ff 48%, #fff 100%);
}

.recovery-page__card {
  width: min(560px, 100%);
  padding: 42px;
  border: 1px solid rgb(112 86 207 / 16%);
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 30px 90px rgb(69 53 128 / 14%);
  text-align: center;
}

.recovery-page__code {
  margin-bottom: 12px;
  color: #7056cf;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.recovery-page h1 {
  margin: 0 0 14px;
  color: #1f2940;
  font-size: clamp(28px, 5vw, 42px);
}

.recovery-page p {
  margin: 0 auto;
  max-width: 460px;
  color: #647089;
  line-height: 1.8;
}

.recovery-page__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.recovery-page__button {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid #d5dbea;
  border-radius: 11px;
  background: #fff;
  color: #35435e;
  cursor: pointer;
}

.recovery-page__button:hover,
.recovery-page__button:focus-visible {
  border-color: #7056cf;
  outline: none;
}

.recovery-page__button--primary {
  border-color: #7056cf;
  background: #7056cf;
  color: #fff;
}
</style>
