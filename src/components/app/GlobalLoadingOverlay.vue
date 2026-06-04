<template>
  <Transition name="global-loading-fade">
    <div v-if="loading.visible" class="global-loading-overlay" aria-live="polite" aria-busy="true">
      <div class="global-loading-overlay__veil"></div>

      <div class="global-loading-overlay__content">
        <div class="global-loading-overlay__mark" aria-hidden="true">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 8H36M16 44H36M18 8C18 16.2 24 16.6 24 26C24 35.4 18 35.8 18 44M34 8C34 16.2 28 16.6 28 26C28 35.4 34 35.8 34 44"
              stroke="url(#loadingGradient)"
              stroke-width="3.2"
              stroke-linecap="round"
            />
            <defs>
              <linearGradient id="loadingGradient" x1="12" y1="8" x2="39" y2="44" gradientUnits="userSpaceOnUse">
                <stop stop-color="#B0F862" />
                <stop offset="0.55" stop-color="#F0C27A" />
                <stop offset="1" stop-color="#B969FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p class="global-loading-overlay__text">{{ loading.message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePageLoadingStore } from '@/stores/pageLoading'

const loading = usePageLoadingStore()
</script>

<style scoped>
.global-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: grid;
  place-items: center;
  pointer-events: auto;
}

.global-loading-overlay__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgb(255 255 255 / 9%) 0%, rgb(255 255 255 / 5%) 24%, rgb(8 8 9 / 82%) 100%);
  backdrop-filter: blur(7px);
}

.global-loading-overlay__content {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 20px;
  padding: 22px 30px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 22px;
  background: linear-gradient(180deg, rgb(26 27 30 / 92%) 0%, rgb(16 17 18 / 94%) 100%);
  box-shadow:
    0 22px 60px rgb(0 0 0 / 45%),
    inset 0 1px 0 rgb(255 255 255 / 6%);
}

.global-loading-overlay__mark {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  color: #fff;
  animation: loadingMarkPulse 1.25s ease-in-out infinite;
}

.global-loading-overlay__text {
  margin: 0;
  color: #f6f6f6;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.global-loading-fade-enter-active,
.global-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.global-loading-fade-enter-from,
.global-loading-fade-leave-to {
  opacity: 0;
}

@keyframes loadingMarkPulse {
  0%,
  100% {
    transform: scale(0.94);
    opacity: 0.78;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
