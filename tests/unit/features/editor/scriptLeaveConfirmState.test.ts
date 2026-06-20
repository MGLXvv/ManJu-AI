import { describe, expect, it } from 'vitest'
import { buildScriptLeaveDialogCopy, shouldInterceptScriptLeave } from '@/features/editor/scriptLeaveConfirmState'

describe('scriptLeaveConfirmState', () => {
  it('builds stable dialog copy', () => {
    expect(buildScriptLeaveDialogCopy()).toEqual({
      title: '当前文案内容尚未保存',
      description: '确定离开吗？未保存的修改将会丢失。',
      confirmText: '确定离开',
      cancelText: '继续编辑',
    })
  })

  it('intercepts leave only when draft is dirty and bypass flag is off', () => {
    expect(shouldInterceptScriptLeave(false, false)).toBe(false)
    expect(shouldInterceptScriptLeave(true, true)).toBe(false)
    expect(shouldInterceptScriptLeave(true, false)).toBe(true)
  })
})
