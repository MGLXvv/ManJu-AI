<template>
  <Teleport to="body">
    <Transition name="app-confirm-dialog-fade">
      <div v-if="open" class="app-confirm-dialog__mask" @click="emit('cancel')">
        <section
          ref="dialogRef"
          class="app-confirm-dialog"
          :class="[`is-${size}`]"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @click.stop
        >
          <h3 :id="titleId" class="app-confirm-dialog__title" :class="{ 'is-centered': centerTitle }">
            {{ title }}
          </h3>
          <p v-if="description" :id="descriptionId" class="app-confirm-dialog__desc">{{ description }}</p>
          <div class="app-confirm-dialog__actions" :class="{ 'is-centered': centerActions }">
            <button
              class="app-confirm-dialog__btn"
              :class="[`is-${confirmTone}`]"
              type="button"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
            <button class="app-confirm-dialog__btn is-neutral" type="button" @click="emit('cancel')">
              {{ cancelText }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { toRef, useId } from 'vue'
import { useAccessibleDialog } from '@/composables/useAccessibleDialog'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmText: string
    cancelText: string
    confirmTone?: 'primary' | 'danger'
    size?: 'sm' | 'md'
    centerTitle?: boolean
    centerActions?: boolean
  }>(),
  {
    description: '',
    confirmTone: 'primary',
    size: 'md',
    centerTitle: false,
    centerActions: false,
  },
)

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()

const titleId = useId()
const descriptionId = useId()
const { dialogRef } = useAccessibleDialog({
  open: toRef(props, 'open'),
  onRequestClose: () => emit('cancel'),
  initialFocusSelector: '.app-confirm-dialog__btn.is-neutral',
})
</script>

<style scoped>
.app-confirm-dialog__mask {
  position: fixed;
  inset: 0;
  z-index: 245;
  display: grid;
  place-items: center;
  background: rgb(8 8 11 / 62%);
  backdrop-filter: blur(6px);
}

.app-confirm-dialog {
  width: min(420px, calc(100vw - 32px));
  padding: 24px 24px 20px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 18px;
  background: #17171c;
  box-shadow: 0 24px 60px rgb(0 0 0 / 42%);
}

.app-confirm-dialog:focus {
  outline: none;
}

.app-confirm-dialog.is-sm {
  width: min(280px, calc(100vw - 32px));
  padding: 24px 20px 18px;
  border-radius: 16px;
}

.app-confirm-dialog__title {
  margin: 0;
  color: #fff;
  font-size: 20px;
  line-height: 1.3;
  font-weight: 700;
}

.app-confirm-dialog.is-sm .app-confirm-dialog__title {
  font-size: 16px;
  line-height: 1.4;
  font-weight: 600;
}

.app-confirm-dialog__title.is-centered {
  text-align: center;
}

.app-confirm-dialog__desc {
  margin: 10px 0 0;
  color: rgb(255 255 255 / 64%);
  font-size: 14px;
  line-height: 1.6;
}

.app-confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.app-confirm-dialog__actions.is-centered {
  justify-content: center;
}

.app-confirm-dialog.is-sm .app-confirm-dialog__actions {
  gap: 14px;
  margin-top: 22px;
}

.app-confirm-dialog__btn {
  min-width: 96px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background: #2f3136;
  color: #f3f3f4;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.app-confirm-dialog.is-sm .app-confirm-dialog__btn {
  min-width: 84px;
  height: 34px;
  border-radius: 10px;
  font-weight: 500;
}

.app-confirm-dialog__btn.is-primary {
  border-color: transparent;
  background: linear-gradient(90deg, #b969ff 0%, #ef86ff 100%);
  color: #170d1d;
}

.app-confirm-dialog__btn.is-danger {
  border-color: rgb(255 121 145 / 34%);
  background: rgb(255 107 129 / 14%);
  color: #ffd0d8;
}

.app-confirm-dialog__btn.is-neutral {
  background: #232425;
  color: #f1eff5;
}

.app-confirm-dialog-fade-enter-active,
.app-confirm-dialog-fade-leave-active {
  transition: opacity 180ms ease;
}

.app-confirm-dialog-fade-enter-from,
.app-confirm-dialog-fade-leave-to {
  opacity: 0;
}
</style>
