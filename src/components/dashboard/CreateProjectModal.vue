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

<style scoped lang="scss">
.create-project-modal {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: grid;
  place-items: center;
  padding: 24px;
}

.create-project-modal__overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgb(185 105 255 / 10%), transparent 42%),
    rgb(5 6 10 / 72%);
  backdrop-filter: blur(10px);
}

.create-project-modal__dialog {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
  display: grid;
  gap: 24px;
  padding: 24px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgb(31 31 37 / 98%) 0%, rgb(19 20 25 / 98%) 100%);
  box-shadow:
    0 22px 60px rgb(0 0 0 / 44%),
    inset 0 1px 0 rgb(255 255 255 / 5%);
}

.create-project-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.create-project-modal__title {
  margin: 0;
  color: #fff;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 600;
}

.create-project-modal__close {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: rgb(255 255 255 / 6%);
  color: #d8d8df;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.create-project-modal__close:hover {
  background: rgb(255 255 255 / 10%);
  color: #fff;
  transform: translateY(-1px);
}

.create-project-modal__body {
  display: grid;
  gap: 20px;
}

.create-project-modal__field {
  display: grid;
  gap: 10px;
}

.create-project-modal__label {
  color: #d9dae1;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 500;
}

.create-project-modal__input,
.create-project-modal__select {
  width: 100%;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  background: rgb(255 255 255 / 4%);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

.create-project-modal__input::placeholder {
  color: #8b8d99;
}

.create-project-modal__input:focus,
.create-project-modal__select:focus {
  border-color: rgb(185 105 255 / 78%);
  box-shadow: 0 0 0 3px rgb(185 105 255 / 14%);
  background: rgb(255 255 255 / 6%);
}

.create-project-modal__select {
  appearance: none;
}

.create-project-modal__select:disabled,
.create-project-modal__submit:disabled {
  cursor: not-allowed;
}

.create-project-modal__select:disabled {
  color: #7c7d88;
  background: rgb(255 255 255 / 3%);
}

.create-project-modal__select-wrap {
  position: relative;
}

.create-project-modal__select-wrap::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 16px;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid #9b9ca7;
  border-bottom: 1.5px solid #9b9ca7;
  transform: translateY(-60%) rotate(45deg);
  pointer-events: none;
}

.create-project-modal__ratio-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.create-project-modal__ratio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 14px;
  background: rgb(255 255 255 / 4%);
  color: #d9dae1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.create-project-modal__ratio:hover {
  border-color: rgb(255 255 255 / 20%);
  background: rgb(255 255 255 / 7%);
  transform: translateY(-1px);
}

.create-project-modal__ratio.is-active {
  border-color: rgb(185 105 255 / 80%);
  background: rgb(185 105 255 / 14%);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgb(185 105 255 / 24%);
}

.create-project-modal__ratio-icon {
  display: inline-block;
  border: 1.5px solid currentColor;
  border-radius: 4px;
  opacity: 0.85;
}

.create-project-modal__ratio-icon--landscape {
  width: 22px;
  height: 14px;
}

.create-project-modal__ratio-icon--portrait {
  width: 14px;
  height: 22px;
}

.create-project-modal__hint {
  margin: 0;
  color: #8f90a0;
  font-size: 12px;
  line-height: 1.5;
}

.create-project-modal__submit {
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #b969ff 0%, #df7cff 100%);
  color: #fff;
  font-size: 15px;
  line-height: 1;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 28px rgb(185 105 255 / 24%);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.create-project-modal__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgb(185 105 255 / 30%);
}

.create-project-modal__submit:disabled {
  opacity: 0.52;
  box-shadow: none;
}

.create-project-modal__field.is-invalid .create-project-modal__input,
.create-project-modal__field.is-invalid .create-project-modal__select,
.create-project-modal__field.is-invalid .create-project-modal__ratio-grid {
  border-color: rgb(255 106 138 / 70%);
}

.create-project-modal__field.is-invalid .create-project-modal__ratio {
  border-color: rgb(255 106 138 / 44%);
}

.create-project-modal__field.is-flash .create-project-modal__input,
.create-project-modal__field.is-flash .create-project-modal__select {
  box-shadow: 0 0 0 3px rgb(255 106 138 / 14%);
}

.create-project-modal__field.is-flash .create-project-modal__ratio-grid {
  border-radius: 16px;
  box-shadow: 0 0 0 3px rgb(255 106 138 / 10%);
}

@media (max-width: 640px) {
  .create-project-modal {
    padding: 16px;
  }

  .create-project-modal__dialog {
    gap: 20px;
    padding: 20px;
    border-radius: 20px;
  }

  .create-project-modal__title {
    font-size: 20px;
  }

  .create-project-modal__ratio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
