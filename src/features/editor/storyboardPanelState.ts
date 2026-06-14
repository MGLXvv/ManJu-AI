const STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY = 'manju:storyboard:prompt-panel-collapsed'

export const loadStoryboardPromptCollapsed = (fallback = false): boolean => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY)
    if (raw === null) {
      return fallback
    }

    return raw === '1'
  } catch {
    return fallback
  }
}

export const saveStoryboardPromptCollapsed = (collapsed: boolean): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // Ignore storage failures and keep UI responsive.
  }
}

