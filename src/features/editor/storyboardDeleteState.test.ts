import { describe, expect, it } from 'vitest'
import { buildStoryboardDeleteDialogCopy, buildStoryboardDeleteToastMessage } from './storyboardDeleteState'

describe('storyboardDeleteState', () => {
  it('builds single delete dialog copy', () => {
    expect(buildStoryboardDeleteDialogCopy()).toEqual({
      title: '确定删除当前分镜吗？',
      confirmText: '删除',
      cancelText: '取消',
    })
  })

  it('builds matching success toast message', () => {
    expect(buildStoryboardDeleteToastMessage()).toBe('分镜已删除')
  })
})
