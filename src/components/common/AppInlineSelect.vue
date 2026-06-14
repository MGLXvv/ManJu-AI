<template>
  <div
    ref="rootRef"
    class="app-inline-select"
    :class="[
      { 'app-inline-select--plain': variant === 'plain' },
      { 'is-open': open, 'is-disabled': disabled },
    ]"
  >
    <button
      type="button"
      class="app-inline-select__trigger"
      :class="triggerClass"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggleOpen"
    >
      <span class="app-inline-select__label" :class="{ 'is-placeholder': !selectedOption }">
        {{ selectedOption?.label ?? placeholder }}
      </span>
      <span class="app-inline-select__arrow" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="app-inline-select__menu"
        :class="menuClass"
        :style="menuStyle"
        role="listbox"
      >
        <button
          v-for="option in options"
          :key="String(option.value)"
          type="button"
          class="app-inline-select__option"
          :class="[optionClass, { 'is-active': option.value === modelValue }]"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface AppInlineSelectOption {
  label: string
  value: string | number
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    options: AppInlineSelectOption[]
    placeholder?: string
    disabled?: boolean
    variant?: 'default' | 'plain'
    triggerClass?: string
    menuClass?: string
    optionClass?: string
  }>(),
  {
    placeholder: '请选择',
    disabled: false,
    variant: 'default',
    triggerClass: '',
    menuClass: '',
    optionClass: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const open = ref(false)
const menuStyle = ref<Record<string, string>>({})

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue) ?? null)

const updateMenuPosition = (): void => {
  const root = rootRef.value
  if (!root) return

  const rect = root.getBoundingClientRect()
  menuStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
    width: `${rect.width}px`,
    zIndex: '420',
  }
}

const openMenu = async (): Promise<void> => {
  if (props.disabled) return
  open.value = true
  await nextTick()
  updateMenuPosition()
}

const closeMenu = (): void => {
  open.value = false
}

const toggleOpen = (): void => {
  if (open.value) {
    closeMenu()
    return
  }
  void openMenu()
}

const selectOption = (value: string | number): void => {
  emit('update:modelValue', value)
  closeMenu()
}

const handleDocumentMouseDown = (event: MouseEvent): void => {
  const target = event.target as Node | null
  if (!target) return

  if (rootRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return
  }

  closeMenu()
}

const handleWindowResize = (): void => {
  if (open.value) {
    updateMenuPosition()
  }
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      closeMenu()
    }
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentMouseDown)
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('scroll', handleWindowResize, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMouseDown)
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('scroll', handleWindowResize, true)
})
</script>

<style scoped>
.app-inline-select {
  position: relative;
  width: 100%;
  min-width: 0;
}

.app-inline-select__trigger {
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 34px 0 12px;
  border: 1px solid #323232;
  border-radius: 8px;
  background: #232425;
  color: #d2d2d2;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}

.app-inline-select__trigger:hover {
  border-color: rgb(255 255 255 / 16%);
  background: #27292b;
}

.app-inline-select.is-open .app-inline-select__trigger {
  border-color: rgb(185 105 255 / 46%);
  box-shadow: 0 0 0 1px rgb(185 105 255 / 14%);
}

.app-inline-select--plain .app-inline-select__trigger,
.app-inline-select--plain .app-inline-select__trigger:hover,
.app-inline-select--plain.is-open .app-inline-select__trigger {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.app-inline-select__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
}

.app-inline-select__label.is-placeholder {
  color: #7f8084;
}

.app-inline-select__arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  color: #d2d2d2;
  pointer-events: none;
}

.app-inline-select.is-open .app-inline-select__arrow {
  transform: translateY(-50%) rotate(180deg);
}

.app-inline-select__menu {
  padding: 6px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 12px;
  background: #17181b;
  box-shadow:
    0 18px 40px rgb(0 0 0 / 42%),
    inset 0 1px 0 rgb(255 255 255 / 4%);
  display: grid;
  gap: 4px;
}

.app-inline-select__option {
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #d2d2d2;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.app-inline-select__option:hover {
  background: rgb(255 255 255 / 6%);
  color: #fff;
}

.app-inline-select__option.is-active {
  background: linear-gradient(90deg, rgb(185 105 255 / 16%) 0%, rgb(239 134 255 / 12%) 100%);
  color: #fff;
}

.app-inline-select.is-disabled .app-inline-select__trigger,
.app-inline-select__trigger:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
