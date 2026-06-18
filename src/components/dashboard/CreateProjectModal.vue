<template>
  <Teleport to="body">
    <div v-if="open" class="create-project-modal">
      <div class="create-project-modal__overlay" @click="requestClose"></div>

      <section class="create-project-modal__dialog" role="dialog" aria-modal="true" aria-label="新建项目设置">
        <header class="create-project-modal__header">
          <h2 class="create-project-modal__title">新建项目设置</h2>
          <button class="create-project-modal__close" type="button" aria-label="关闭" @click="requestClose">×</button>
        </header>

        <form class="create-project-modal__body" @submit.prevent="submit">
          <label
            class="create-project-modal__field"
            :class="{ 'is-invalid': fieldErrors.name, 'is-flash': fieldErrors.name }"
            :key="`name-${invalidFlashNonce}`"
          >
            <span class="create-project-modal__label">项目名称</span>
            <input
              v-model.trim="form.name"
              class="create-project-modal__input"
              type="text"
              placeholder="请输入项目名称"
            />
          </label>

          <div
            class="create-project-modal__field"
            :class="{ 'is-invalid': fieldErrors.ratio, 'is-flash': fieldErrors.ratio }"
            :key="`ratio-${invalidFlashNonce}`"
          >
            <span class="create-project-modal__label">画面比例</span>

            <div class="create-project-modal__ratio-grid">
              <button
                type="button"
                class="create-project-modal__ratio"
                :class="{ 'is-active': form.ratio === '16:9' }"
                @click="form.ratio = '16:9'"
              >
                <span class="create-project-modal__ratio-icon create-project-modal__ratio-icon--landscape"></span>
                <span>横版 16:9</span>
              </button>

              <button
                type="button"
                class="create-project-modal__ratio"
                :class="{ 'is-active': form.ratio === '9:16' }"
                @click="form.ratio = '9:16'"
              >
                <span class="create-project-modal__ratio-icon create-project-modal__ratio-icon--portrait"></span>
                <span>竖版 9:16</span>
              </button>
            </div>
          </div>

          <label
            class="create-project-modal__field"
            :class="{ 'is-invalid': fieldErrors.style, 'is-flash': fieldErrors.style }"
            :key="`style-${invalidFlashNonce}`"
          >
            <span class="create-project-modal__label">整体风格</span>

            <div class="create-project-modal__select-wrap">
              <select v-model="form.style" class="create-project-modal__select" :disabled="!hasStyleOptions">
                <option value="" disabled>{{ stylePlaceholder }}</option>
                <option v-for="option in enabledStyleOptions" :key="option.id" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <p v-if="!hasStyleOptions" class="create-project-modal__hint">
              {{ emptyStyleMessage }}
            </p>
          </label>

          <button class="create-project-modal__submit" type="submit" :disabled="!hasStyleOptions">创建项目</button>
        </form>

        <AppConfirmDialog
          :open="showCancelConfirm"
          title="确定放弃设置？"
          confirm-text="确定"
          cancel-text="取消"
          confirm-tone="primary"
          size="sm"
          center-title
          center-actions
          @confirm="confirmClose"
          @cancel="cancelCloseConfirm"
        />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import type { ProjectStyleOption } from '@/features/project/projectStyleState'
import {
  createEmptyCreateProjectForm,
  getCreateProjectFieldErrors,
  isCreateProjectFormDirty,
  type CreateProjectFieldErrors,
} from '@/features/dashboard/createProjectModalState'

interface Props {
  styleOptions?: ProjectStyleOption[]
  emptyStyleMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  styleOptions: () => [],
  emptyStyleMessage: '暂无可用风格，请先到系统管理中添加风格',
})

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; ratio: '16:9' | '9:16'; style: string }): void
}>()

const form = reactive(createEmptyCreateProjectForm())
const fieldErrors = ref<CreateProjectFieldErrors>({})
const invalidFlashNonce = ref(0)
const showCancelConfirm = ref(false)

const enabledStyleOptions = computed(() => props.styleOptions.filter((option) => !option.disabled))
const hasStyleOptions = computed(() => enabledStyleOptions.value.length > 0)
const stylePlaceholder = computed(() => (hasStyleOptions.value ? '请选择整体风格' : props.emptyStyleMessage))

const resetForm = (): void => {
  Object.assign(form, createEmptyCreateProjectForm())
  fieldErrors.value = {}
  invalidFlashNonce.value = 0
}

const isDirty = computed(() => isCreateProjectFormDirty(form))

watch(open, (value) => {
  if (value) {
    resetForm()
    showCancelConfirm.value = false
  }
})

watch(
  enabledStyleOptions,
  (options) => {
    if (options.some((option) => option.value === form.style)) {
      return
    }

    form.style = ''
  },
  { immediate: true },
)

const close = (): void => {
  showCancelConfirm.value = false
  open.value = false
}

const requestClose = (): void => {
  if (!isDirty.value) {
    close()
    return
  }

  showCancelConfirm.value = true
}

const confirmClose = (): void => {
  close()
}

const cancelCloseConfirm = (): void => {
  showCancelConfirm.value = false
}

const submit = (): void => {
  if (!hasStyleOptions.value) {
    return
  }

  const nextErrors = getCreateProjectFieldErrors(form)
  fieldErrors.value = nextErrors

  if (Object.keys(nextErrors).length > 0) {
    invalidFlashNonce.value += 1
    return
  }

  emit('submit', {
    name: form.name.trim(),
    ratio: form.ratio as '16:9' | '9:16',
    style: form.style,
  })

  close()
}
</script>
