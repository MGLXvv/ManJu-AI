import { API_ERROR_CODES } from '@/types/api-enums'

const resolveErrorCode = (error: unknown): string => {
  if (error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string') {
    return (error as { code: string }).code
  }

  return error instanceof Error ? error.message : String(error ?? '')
}

export const resolveGenerationTaskErrorMessage = (error: unknown): string | null => {
  const code = resolveErrorCode(error)

  switch (code) {
    case API_ERROR_CODES.generationTaskNotFound:
      return '生成任务不存在，请刷新后重试'
    case API_ERROR_CODES.generationTaskTimeout:
    case 'ECONNABORTED':
      return '生成任务等待超时，请稍后查看结果或重新生成'
    case API_ERROR_CODES.generationTaskCancelled:
    case API_ERROR_CODES.generationTaskAborted:
      return '生成任务已取消'
    case API_ERROR_CODES.generationTaskFailed:
      return '生成任务失败，请稍后再试'
    case API_ERROR_CODES.generationTaskHttpPending:
      return '生成任务已提交，结果仍在处理中，请稍后刷新工作区查看结果'
    default:
      return null
  }
}

export const resolveEditorActionErrorMessage = (error: unknown, fallback: string): string => {
  const generationMessage = resolveGenerationTaskErrorMessage(error)
  if (generationMessage) {
    return generationMessage
  }

  switch (resolveErrorCode(error)) {
    case API_ERROR_CODES.scriptGenerateFailed:
    case API_ERROR_CODES.storyboardGenerateFailed:
      return '生成任务失败，请稍后再试'
    case API_ERROR_CODES.editorSaveFailed:
      return '保存失败，请检查内容后重试'
    case API_ERROR_CODES.editorSaveConflict:
      return '服务器内容已更新，请选择重新加载或覆盖保存'
    case API_ERROR_CODES.editorLocalStorageQuotaExceeded:
      return '浏览器本地空间不足，请导出或复制当前内容后清理存储'
    case API_ERROR_CODES.editorScriptContentContractUnconfirmed:
      return '当前环境暂不能同步生成内容，内容仍保存在当前浏览器'
    case API_ERROR_CODES.editorPartitionHttpUnsupported:
      return '当前环境暂不支持同步此编辑内容'
    default:
      return fallback
  }
}
