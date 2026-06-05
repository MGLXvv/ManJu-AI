import { describe, expect, it } from 'vitest'
import { buildDeleteDialogCopy, buildDeleteToastMessage } from './projectDeleteState'

describe('projectDeleteState', () => {
  it('builds single delete dialog copy', () => {
    expect(buildDeleteDialogCopy(1)).toEqual({
      title: '确定删除当前项目？',
      confirmText: '删除',
      cancelText: '取消',
    })
  })

  it('builds batch delete dialog copy', () => {
    expect(buildDeleteDialogCopy(3)).toEqual({
      title: '确定删除选中的 3 个项目？',
      confirmText: '批量删除',
      cancelText: '取消',
    })
  })

  it('builds matching success toast message', () => {
    expect(buildDeleteToastMessage(1)).toBe('项目已删除')
    expect(buildDeleteToastMessage(4)).toBe('已删除 4 个项目')
  })
})
