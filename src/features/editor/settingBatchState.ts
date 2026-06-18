export type SettingBatchActionKey = 'favorite' | 'export' | 'delete'

export const toggleSelectVisibleAssets = (selectedIds: string[], visibleIds: string[]): string[] => {
  if (visibleIds.length === 0) {
    return selectedIds
  }

  const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id))
  if (allVisibleSelected) {
    return selectedIds.filter((id) => !visibleIds.includes(id))
  }

  return Array.from(new Set([...selectedIds, ...visibleIds]))
}

export const getSettingBatchActionToast = (action: SettingBatchActionKey): string => {
  if (action === 'favorite') {
    return '已完成收藏'
  }

  if (action === 'export') {
    return '已完成导出'
  }

  return '已完成删除'
}
