import { readLocalString, writeLocalString } from '@/api/local'

const STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY = 'manju:storyboard:prompt-panel-collapsed'

export const loadStoryboardPromptCollapsed = (fallback = false): boolean => {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = readLocalString(STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY)
  if (!raw) {
    return fallback
  }

  return raw === '1'
}

export const saveStoryboardPromptCollapsed = (collapsed: boolean): void => {
  if (typeof window === 'undefined') {
    return
  }

  writeLocalString(STORYBOARD_PROMPT_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
}
