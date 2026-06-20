import { describe, expect, it } from 'vitest'
import { getSettingBatchActionToast, toggleSelectVisibleAssets } from '@/features/editor/settingBatchState'

describe('settingBatchState', () => {
  it('toggles selection only within the current visible assets', () => {
    expect(toggleSelectVisibleAssets([], ['a', 'b'])).toEqual(['a', 'b'])
    expect(toggleSelectVisibleAssets(['a', 'b'], ['a', 'b'])).toEqual([])
    expect(toggleSelectVisibleAssets(['x'], ['a', 'b'])).toEqual(['x', 'a', 'b'])
  })

  it('returns the confirmed completion toast copy for batch actions', () => {
    expect(getSettingBatchActionToast('favorite')).toBe('已完成收藏')
    expect(getSettingBatchActionToast('export')).toBe('已完成导出')
    expect(getSettingBatchActionToast('delete')).toBe('已完成删除')
  })
})
