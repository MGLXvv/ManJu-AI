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
  form.style = enabledStyleOptions.value[0]?.value ?? ''
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

    form.style = options[0]?.value ?? ''
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
  padding: 20px;
}

.create-project-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgb(5 6 10 / 68%);
  backdrop-filter: blur(6px);
}

.create-project-modal__dialog {
  position: relative;
  z-index: 1;
  width: min(100%, 558px);
  min-height: 426px;
  display: grid;
  grid-template-rows: 52px 1fr;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 18px;
  background: #0a0a0b;
  box-shadow: 0 4px 10.8px rgb(0 0 0 / 25%);
  overflow: hidden;
}

.create-project-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px solid #323232;
}

.create-project-modal__title {
  margin: 0;
  color: #fff;
  font-size: 16px;
  line-height: 19px;
  font-weight: 600;
}

.create-project-modal__close {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.create-project-modal__close:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.create-project-modal__body {
  display: grid;
  align-content: start;
  gap: 0;
  padding: 20px;
}

.create-project-modal__field {
  display: grid;
  gap: 10px;
}

.create-project-modal__field + .create-project-modal__field {
  margin-top: 14px;
}

.create-project-modal__label {
  color: #979797;
  font-size: 14px;
  line-height: 17px;
  font-weight: 600;
}

.create-project-modal__input,
.create-project-modal__select {
  width: 100%;
  height: 40px;
  min-height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: #232425;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition:
    box-shadow 160ms ease,
    background 160ms ease;
}

.create-project-modal__input::placeholder {
  color: #646357;
}

.create-project-modal__input:focus,
.create-project-modal__select:focus {
  box-shadow: 0 0 0 3px rgb(140 63 255 / 16%);
  background: #28292a;
}

.create-project-modal__select {
  appearance: none;
}

.create-project-modal__select:disabled,
.create-project-modal__submit:disabled {
  cursor: not-allowed;
}

.create-project-modal__select:disabled {
  color: #646357;
  background: #232425;
  opacity: 0.72;
}

.create-project-modal__select-wrap {
  position: relative;
}

.create-project-modal__select-wrap::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 18px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #d2d2d2;
  border-bottom: 2px solid #d2d2d2;
  transform: translateY(-65%) rotate(45deg);
  pointer-events: none;
}

.create-project-modal__ratio-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.create-project-modal__ratio {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  height: 71px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: #232425;
  color: #979797;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
  text-align: center;
}

.create-project-modal__ratio:hover {
  background: #2a2b2c;
  transform: translateY(-1px);
}

.create-project-modal__ratio.is-active {
  color: #fff;
  border: 2px solid transparent;
  background:
    linear-gradient(#171124, #171124) padding-box,
    linear-gradient(90deg, #8b5cf6 0%, #f8a45f 100%) border-box;
  box-shadow: none;
}

.create-project-modal__ratio-icon {
  display: block;
  border: 0;
  border-radius: 1px;
}

.create-project-modal__ratio-icon--landscape {
  width: 23px;
  height: 13px;
  background: linear-gradient(90deg, #b0f862 0%, #8b5cf6 100%);
}

.create-project-modal__ratio-icon--portrait {
  width: 13px;
  height: 23px;
  background: linear-gradient(180deg, #b0f862 0%, #8b5cf6 100%);
}

.create-project-modal__hint {
  margin: 0;
  color: #979797;
  font-size: 12px;
  line-height: 1.5;
}

.create-project-modal__submit {
  height: 40px;
  margin-top: 20px;
  border: 0;
  border-radius: 8px;
  background:
    radial-gradient(64.4% 133.41% at 97.53% 113.7%, rgb(255 187 77 / 60%) 0%, rgb(140 63 255 / 0%) 100%),
    #8c3fff;
  color: #fff;
  font-size: 13px;
  line-height: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow:
    0 18px 32px rgb(0 0 0 / 34%),
    inset 0 0 39.4px rgb(255 255 255 / 28%);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.create-project-modal__submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

.create-project-modal__submit:disabled {
  opacity: 0.45;
  box-shadow: none;
}

.create-project-modal__field.is-invalid .create-project-modal__input,
.create-project-modal__field.is-invalid .create-project-modal__select {
  box-shadow: inset 0 0 0 1px rgb(255 106 138 / 70%);
}

.create-project-modal__field.is-invalid .create-project-modal__ratio {
  box-shadow: inset 0 0 0 1px rgb(255 106 138 / 52%);
}

.create-project-modal__field.is-flash .create-project-modal__input,
.create-project-modal__field.is-flash .create-project-modal__select {
  box-shadow: 0 0 0 3px rgb(255 106 138 / 12%);
}

@media (max-width: 640px) {
  .create-project-modal {
    padding: 16px;
  }

  .create-project-modal__dialog {
    min-height: auto;
  }

  .create-project-modal__ratio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
