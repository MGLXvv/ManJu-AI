export interface StoryboardLeaveDialogCopy {
  title: string
  description: string
  confirmText: string
  cancelText: string
}

export const buildStoryboardLeaveDialogCopy = (): StoryboardLeaveDialogCopy => ({
  title: '当前分镜内容尚未保存',
  description: '确定离开吗？未保存的修改将会丢失。',
  confirmText: '确定离开',
  cancelText: '继续编辑',
})

export function shouldInterceptStoryboardLeave(isDirty: boolean, bypassLeaveGuard = false): boolean {
  return isDirty && !bypassLeaveGuard
}
