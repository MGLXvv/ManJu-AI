import { isApiError } from '@/api/errors'
import { API_ERROR_CODES } from '@/types/api-enums'

const isQuotaErrorLike = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const value = error as { name?: string; code?: number }
  return value.name === 'QuotaExceededError' || value.name === 'NS_ERROR_DOM_QUOTA_REACHED' || value.code === 22 || value.code === 1014
}

export const buildSettingSaveErrorMessage = (error: unknown, apiMode: 'mock' | 'http'): string => {
  if (isApiError(error)) {
    if (error.code === API_ERROR_CODES.editorLocalStorageQuotaExceeded) {
      return '浏览器本地存储空间不足，请清理缓存或减少上传图片后再保存'
    }

    if (error.code === API_ERROR_CODES.editorSaveFailed) {
      return '草稿触发了 mock 保存失败，请检查内容中是否包含 #mock-save-fail'
    }
  }

  if (isQuotaErrorLike(error)) {
    return '浏览器本地存储空间不足，请清理缓存或减少上传图片后再保存'
  }

  if (apiMode === 'http') {
    return '设定保存失败，请检查后端草稿保存接口或网络状态'
  }

  return '设定保存失败，请打开控制台查看具体错误'
}
