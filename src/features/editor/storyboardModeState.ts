export type StoryboardMode = 'image' | 'multi-param' | null

export interface StoryboardModeEntryState {
  locked: boolean
  mode: Exclude<StoryboardMode, null>
}

export type StoryboardToolAction =
  | 'edit'
  | 'view'
  | 'toggle-hidden'
  | 'lock'
  | 'zoom'
  | 'copy'
  | 'delete'

export interface StoryboardToolAvailability {
  enabled: boolean
  reason: string
}

export const getStoryboardModeEntryState = (mode: StoryboardMode): StoryboardModeEntryState => ({
  locked: mode !== null,
  mode: mode ?? 'multi-param',
})

export const resolveStoryboardToolAvailability = (input: {
  mode: StoryboardMode
  action: StoryboardToolAction
  isLocked: boolean
}): StoryboardToolAvailability => {
  if (input.action === 'view') {
    return {
      enabled: true,
      reason: '',
    }
  }

  if (input.mode !== 'image') {
    return {
      enabled: false,
      reason: '图片生成模式可用',
    }
  }

  if (input.action === 'lock') {
    return {
      enabled: true,
      reason: '',
    }
  }

  if (input.isLocked) {
    return {
      enabled: false,
      reason: '当前镜头已锁定',
    }
  }

  return {
    enabled: true,
    reason: '',
  }
}
