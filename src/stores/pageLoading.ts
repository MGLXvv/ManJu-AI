import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePageLoadingStore = defineStore('page-loading', () => {
  const visible = ref(false)
  const message = ref('请稍后，正在加载......')
  const startedAt = ref(0)
  const activeToken = ref(0)

  const begin = (nextMessage = '请稍后，正在加载......'): number => {
    activeToken.value += 1
    message.value = nextMessage
    visible.value = true
    startedAt.value = Date.now()
    return activeToken.value
  }

  const end = (token?: number): void => {
    if (token && token !== activeToken.value) {
      return
    }
    visible.value = false
  }

  return {
    visible,
    message,
    startedAt,
    activeToken,
    begin,
    end,
  }
})
