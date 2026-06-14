<template>
  <Teleport to="body">
    <Transition name="storyboard-batch-generate-dialog-fade">
      <div v-if="open" class="storyboard-batch-generate-dialog__mask" @click="emit('cancel')">
        <section
          class="storyboard-batch-generate-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="storyboard-batch-generate-dialog-title"
          @click.stop
        >
          <header class="storyboard-batch-generate-dialog__header">
            <h3 id="storyboard-batch-generate-dialog-title">批量生成</h3>
            <button type="button" class="storyboard-batch-generate-dialog__close" aria-label="关闭" @click="emit('cancel')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M10.5 3.5L3.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="storyboard-batch-generate-dialog__body">
            <div class="storyboard-batch-generate-dialog__mode-row">
              <button
                type="button"
                class="storyboard-batch-generate-dialog__mode-btn"
                :class="{ 'is-active': draftMode === 'immediate' }"
                @click="draftMode = 'immediate'"
              >
                立即生成
              </button>
              <button
                type="button"
                class="storyboard-batch-generate-dialog__mode-btn"
                :class="{ 'is-active': draftMode === 'scheduled' }"
                @click="draftMode = 'scheduled'"
              >
                <span>定时生成</span>
                <small>选择时间</small>
              </button>
            </div>

            <div v-if="draftMode === 'scheduled'" class="storyboard-batch-generate-dialog__schedule">
              <span class="storyboard-batch-generate-dialog__label">选择生成时间</span>
              <div class="storyboard-batch-generate-dialog__schedule-row">
                <select v-model="draftScheduledDate">
                  <option v-for="option in dateOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>

                <select v-model="draftScheduledTime">
                  <option v-for="option in timeOptions" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <footer class="storyboard-batch-generate-dialog__actions">
            <button type="button" class="storyboard-batch-generate-dialog__confirm" @click="confirm">确定</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type StoryboardBatchGenerateMode = 'immediate' | 'scheduled'

interface DateOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    selectedCount: number
    initialMode?: StoryboardBatchGenerateMode
    initialScheduledDate?: string
    initialScheduledTime?: string
  }>(),
  {
    initialMode: 'immediate',
    initialScheduledDate: '',
    initialScheduledTime: '08:00',
  },
)

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', payload: {
    mode: StoryboardBatchGenerateMode
    scheduledDate: string | null
    scheduledTime: string | null
  }): void
}>()

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildDateOptions = (): DateOption[] => {
  const base = new Date()
  const labels = ['今天', '明天', '后天']

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(base)
    nextDate.setDate(base.getDate() + index)

    return {
      value: formatDateValue(nextDate),
      label: `${labels[index] ? `${labels[index]} ` : ''}${nextDate.getMonth() + 1}月${nextDate.getDate()}日`,
    }
  })
}

const dateOptions = buildDateOptions()
const timeOptions = Array.from({ length: 24 }, (_, index) => `${`${index}`.padStart(2, '0')}:00`)

const draftMode = ref<StoryboardBatchGenerateMode>(props.initialMode)
const draftScheduledDate = ref(props.initialScheduledDate || dateOptions[0]?.value || '')
const draftScheduledTime = ref(props.initialScheduledTime)

const normalizedScheduledDate = computed(() => draftScheduledDate.value || dateOptions[0]?.value || '')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    draftMode.value = props.initialMode
    draftScheduledDate.value = props.initialScheduledDate || dateOptions[0]?.value || ''
    draftScheduledTime.value = props.initialScheduledTime
  },
)

const confirm = (): void => {
  emit('confirm', {
    mode: draftMode.value,
    scheduledDate: draftMode.value === 'scheduled' ? normalizedScheduledDate.value : null,
    scheduledTime: draftMode.value === 'scheduled' ? draftScheduledTime.value : null,
  })
}
</script>
