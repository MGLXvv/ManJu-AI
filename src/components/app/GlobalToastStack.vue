<template>
  <Teleport to="body">
    <Transition name="global-toast">
      <div v-if="feedback.visible" class="global-toast-stack" aria-live="polite">
        <div class="global-toast" :class="`is-${feedback.tone}`">
          {{ feedback.message }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiFeedbackStore } from '@/stores/uiFeedback'

const feedback = useUiFeedbackStore()
</script>

<style scoped lang="scss">
.global-toast-stack {
  position: fixed;
  left: 50%;
  bottom: 36px;
  z-index: 2200;
  transform: translateX(-50%);
  pointer-events: none;
}

.global-toast {
  min-width: 220px;
  max-width: min(540px, calc(100vw - 32px));
  padding: 12px 16px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 12px;
  background: rgb(18 19 23 / 92%);
  box-shadow: 0 18px 44px rgb(0 0 0 / 38%);
  color: #f6f6f7;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  text-align: center;
  backdrop-filter: blur(12px);
}

.global-toast.is-success {
  border-color: rgb(176 248 98 / 28%);
}

.global-toast.is-error {
  border-color: rgb(255 120 120 / 28%);
}

.global-toast-enter-active,
.global-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.global-toast-enter-from,
.global-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
