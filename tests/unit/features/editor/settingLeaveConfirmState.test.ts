import { describe, expect, it } from 'vitest'
import { buildSettingLeaveDialogCopy, shouldInterceptSettingLeave } from '@/features/editor/settingLeaveConfirmState'

describe('settingLeaveConfirmState', () => {
  it('builds stable dialog copy', () => {
    expect(buildSettingLeaveDialogCopy()).toEqual({
      title: '当前设定内容尚未保存',
      description: '确定离开吗？未保存的修改将会丢失。',
      confirmText: '确定离开',
      cancelText: '继续编辑',
    })
  })

  it('intercepts leave only when draft is dirty and bypass flag is off', () => {
    expect(shouldInterceptSettingLeave(false, false)).toBe(false)
    expect(shouldInterceptSettingLeave(true, true)).toBe(false)
    expect(shouldInterceptSettingLeave(true, false)).toBe(true)
  })
})
