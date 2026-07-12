import { nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const dialogStack: symbol[] = []
let bodyLockCount = 0
let previousBodyOverflow = ''

interface AccessibleDialogOptions {
  open: Ref<boolean> | ComputedRef<boolean>
  onRequestClose?: () => void
  initialFocusSelector?: string
  restoreFocus?: boolean
  lockScroll?: boolean
}

const isHTMLElement = (value: unknown): value is HTMLElement =>
  typeof HTMLElement !== 'undefined' && value instanceof HTMLElement

const getFocusableElements = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter((element) => {
    if (element.hidden || element.getAttribute('aria-hidden') === 'true' || element.tabIndex < 0) {
      return false
    }

    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })

const lockBodyScroll = (): void => {
  if (typeof document === 'undefined') return

  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyLockCount += 1
}

const unlockBodyScroll = (): void => {
  if (typeof document === 'undefined' || bodyLockCount === 0) return

  bodyLockCount -= 1
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }
}

export const useAccessibleDialog = ({
  open,
  onRequestClose,
  initialFocusSelector,
  restoreFocus = true,
  lockScroll = true,
}: AccessibleDialogOptions) => {
  const dialogRef = ref<HTMLElement | null>(null)
  const token = Symbol('accessible-dialog')
  let restoreTarget: HTMLElement | null = null
  let active = false

  const isTopDialog = (): boolean => dialogStack.at(-1) === token

  const focusInitialElement = (): void => {
    const root = dialogRef.value
    if (!root) return

    const requested = initialFocusSelector ? root.querySelector<HTMLElement>(initialFocusSelector) : null
    const target = requested ?? getFocusableElements(root)[0] ?? root
    target.focus({ preventScroll: true })
  }

  const handleKeydown = (event: KeyboardEvent): void => {
    if (!isTopDialog()) return

    if (event.key === 'Escape' && onRequestClose) {
      event.preventDefault()
      event.stopPropagation()
      onRequestClose()
      return
    }

    if (event.key !== 'Tab') return

    const root = dialogRef.value
    if (!root) return

    const focusable = getFocusableElements(root)
    if (focusable.length === 0) {
      event.preventDefault()
      root.focus({ preventScroll: true })
      return
    }

    const first = focusable[0]
    const last = focusable.at(-1) ?? first
    const current = document.activeElement
    const focusIsInside = current instanceof Node && root.contains(current)

    if (event.shiftKey && (!focusIsInside || current === first)) {
      event.preventDefault()
      last.focus({ preventScroll: true })
      return
    }

    if (!event.shiftKey && (!focusIsInside || current === last)) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  const activate = async (): Promise<void> => {
    if (active || typeof document === 'undefined') return

    active = true
    restoreTarget = isHTMLElement(document.activeElement) ? document.activeElement : null
    dialogStack.push(token)
    document.addEventListener('keydown', handleKeydown, true)
    if (lockScroll) lockBodyScroll()

    await nextTick()
    if (open.value && isTopDialog()) focusInitialElement()
  }

  const deactivate = (): void => {
    if (!active || typeof document === 'undefined') return

    active = false
    document.removeEventListener('keydown', handleKeydown, true)
    const stackIndex = dialogStack.lastIndexOf(token)
    if (stackIndex >= 0) dialogStack.splice(stackIndex, 1)
    if (lockScroll) unlockBodyScroll()

    const target = restoreTarget
    restoreTarget = null
    if (restoreFocus && target?.isConnected) {
      void nextTick(() => target.focus({ preventScroll: true }))
    }
  }

  watch(
    open,
    (value) => {
      if (value) {
        void activate()
      } else {
        deactivate()
      }
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(deactivate)

  return { dialogRef }
}
