import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UiToastTone = 'info' | 'success' | 'error'

export interface UiToastOptions {
  tone?: UiToastTone
  duration?: number
}

export const useUiFeedbackStore = defineStore('ui-feedback', () => {
  const visible = ref(false)
  const message = ref('')
  const tone = ref<UiToastTone>('info')
  const activeToken = ref(0)
  let dismissTimer: number | null = null

  const clearToast = (): void => {
    visible.value = false
    message.value = ''
    if (dismissTimer) {
      window.clearTimeout(dismissTimer)
      dismissTimer = null
    }
  }

  const showToast = (nextMessage: string, options: UiToastOptions = {}): number => {
    activeToken.value += 1
    visible.value = true
    message.value = nextMessage
    tone.value = options.tone ?? 'info'

    if (dismissTimer) {
      window.clearTimeout(dismissTimer)
    }

    const duration = Math.max(1200, options.duration ?? 2400)
    dismissTimer = window.setTimeout(() => {
      clearToast()
    }, duration)

    return activeToken.value
  }

  return {
    visible,
    message,
    tone,
    activeToken,
    showToast,
    clearToast,
  }
})
