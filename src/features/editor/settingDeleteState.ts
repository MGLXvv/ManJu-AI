export const buildSettingDeleteDialogCopy = (
  count: number,
): { title: string; confirmText: string; cancelText: string } => {
  if (count > 1) {
    return {
      title: `确定删除选中的 ${count} 个素材吗？`,
      confirmText: '批量删除',
      cancelText: '取消',
    }
  }

  return {
    title: '确定删除当前素材吗？',
    confirmText: '删除',
    cancelText: '取消',
  }
}

export const buildSettingDeleteToastMessage = (count: number): string => {
  return count > 1 ? `已删除 ${count} 个素材` : '素材已删除'
}
