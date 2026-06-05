export interface SettingLeaveDialogCopy {
  title: string
  description: string
  confirmText: string
  cancelText: string
}

export const buildSettingLeaveDialogCopy = (): SettingLeaveDialogCopy => ({
  title: '当前设定内容尚未保存',
  description: '确定离开吗？未保存的修改将会丢失。',
  confirmText: '确定离开',
  cancelText: '继续编辑',
})

export const shouldInterceptSettingLeave = (isDirty: boolean, bypassLeaveGuard: boolean): boolean => {
  return isDirty && !bypassLeaveGuard
}
