export const buildDeleteDialogCopy = (count: number): { title: string; confirmText: string; cancelText: string } => {
  if (count > 1) {
    return {
      title: `确定删除选中的 ${count} 个项目？`,
      confirmText: '批量删除',
      cancelText: '取消',
    }
  }

  return {
    title: '确定删除当前项目？',
    confirmText: '删除',
    cancelText: '取消',
  }
}

export const buildDeleteToastMessage = (count: number): string => {
  return count > 1 ? `已删除 ${count} 个项目` : '项目已删除'
}
