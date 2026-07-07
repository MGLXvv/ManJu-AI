export interface StoryboardLeaveDialogCopy {
  title: string
  description: string
  confirmText: string
  cancelText: string
}

export interface LegacyStoryboardLeaveGuardInput {
  isDirty: boolean
  isLeavingStoryboardStep?: boolean
  bypassLeaveGuard?: boolean
}

export const buildStoryboardLeaveDialogCopy = (): StoryboardLeaveDialogCopy => ({
  title: '当前分镜内容尚未保存',
  description: '确定离开吗？未保存的修改将会丢失。',
  confirmText: '确定离开',
  cancelText: '继续编辑',
})

export function shouldInterceptStoryboardLeave(isDirty: boolean, bypassLeaveGuard: boolean): boolean
export function shouldInterceptStoryboardLeave(input: LegacyStoryboardLeaveGuardInput): boolean
export function shouldInterceptStoryboardLeave(
  inputOrIsDirty: boolean | LegacyStoryboardLeaveGuardInput,
  bypassLeaveGuard = false,
): boolean {
  if (typeof inputOrIsDirty !== 'boolean') {
    return inputOrIsDirty.isDirty && (inputOrIsDirty.isLeavingStoryboardStep ?? true) && !inputOrIsDirty.bypassLeaveGuard
  }

  return inputOrIsDirty && !bypassLeaveGuard
}
