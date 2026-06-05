<template>
  <section class="script-result-block">
    <h2 class="script-column-title">剧本生成</h2>

    <div ref="resultCardRef" class="script-result-card">
      <div class="script-result-card__body">
        <div v-if="loading" class="script-result-card__placeholder">{{ placeholderText }}</div>

        <div v-else-if="!model.trim()" class="script-result-empty" aria-hidden="true">
          <FigmaIcon name="empty-ufo" :size="132" class="script-result-empty__ufo" />
        </div>

        <textarea
          v-else
          v-model="model"
          class="script-result-card__textarea"
          :disabled="disabled"
          placeholder="生成结果会显示在这里"
        />
      </div>

      <footer class="script-result-card__footer">
        <span class="script-result-card__count">共{{ model.length }}个字</span>

        <div class="script-result-card__tools">
          <button
            type="button"
            :disabled="disabled"
            :aria-label="isFullscreen ? '退出全屏' : '全屏'"
            :title="isFullscreen ? '退出全屏' : '全屏'"
            @click="toggleFullscreen"
          >
            <FigmaIcon name="result-fullscreen" :size="20" />
          </button>
          <button
            type="button"
            aria-label="AI优化"
            title="AI优化"
            :disabled="disabled || !model.trim()"
            @click="$emit('optimize')"
          >
            <FigmaIcon name="result-ai-optimize" :size="20" />
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FigmaIcon from '@/components/icons/FigmaIcon.vue'

const props = defineProps<{
  loading?: boolean
  disabled?: boolean
  placeholderText?: string
}>()

defineEmits<{
  (e: 'optimize'): void
}>()

const model = defineModel<string>({ required: true })
const resultCardRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

const placeholderText = computed(() => props.placeholderText || '正在生成剧本...')

const syncFullscreenState = (): void => {
  isFullscreen.value = document.fullscreenElement === resultCardRef.value
}

const toggleFullscreen = async (): Promise<void> => {
  const target = resultCardRef.value
  if (!target) {
    return
  }

  if (document.fullscreenElement === target) {
    await document.exitFullscreen()
    return
  }

  if (!document.fullscreenElement) {
    await target.requestFullscreen()
    return
  }

  await document.exitFullscreen()
  await target.requestFullscreen()
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>
