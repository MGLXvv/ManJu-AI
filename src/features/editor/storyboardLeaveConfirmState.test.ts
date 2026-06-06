import { describe, expect, it } from 'vitest'
import { buildStoryboardLeaveDialogCopy, shouldInterceptStoryboardLeave } from './storyboardLeaveConfirmState'

describe('storyboardLeaveConfirmState', () => {
  it('builds stable dialog copy', () => {
    expect(buildStoryboardLeaveDialogCopy()).toEqual({
      title: '当前分镜内容尚未保存',
      description: '确定离开吗？未保存的修改将会丢失。',
      confirmText: '确定离开',
      cancelText: '继续编辑',
    })
  })

  it('intercepts leave only when draft is dirty and bypass flag is off', () => {
    expect(shouldInterceptStoryboardLeave(false, false)).toBe(false)
    expect(shouldInterceptStoryboardLeave(true, true)).toBe(false)
    expect(shouldInterceptStoryboardLeave(true, false)).toBe(true)
  })
})
