import { describe, expect, it } from 'vitest'
import { buildSettingDeleteDialogCopy, buildSettingDeleteToastMessage } from '@/features/editor/settingDeleteState'

describe('settingDeleteState', () => {
  it('builds single delete dialog copy', () => {
    expect(buildSettingDeleteDialogCopy(1)).toEqual({
      title: '确定删除当前素材吗？',
      confirmText: '删除',
      cancelText: '取消',
    })
  })

  it('builds batch delete dialog copy', () => {
    expect(buildSettingDeleteDialogCopy(3)).toEqual({
      title: '确定删除选中的 3 个素材吗？',
      confirmText: '批量删除',
      cancelText: '取消',
    })
  })

  it('builds matching success toast message', () => {
    expect(buildSettingDeleteToastMessage(1)).toBe('素材已删除')
    expect(buildSettingDeleteToastMessage(4)).toBe('已删除 4 个素材')
  })
})
