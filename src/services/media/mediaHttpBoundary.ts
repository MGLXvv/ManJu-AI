import { createApiError } from '@/api/errors'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { MediaUploadContext } from '@/types/media'
import { isTransientMediaUrl } from './mediaUpload.service'

export const assertHttpMediaUrl = (url: string, context: MediaUploadContext): void => {
  if (!isTransientMediaUrl(url)) {
    return
  }

  throw createApiError({
    code: API_ERROR_CODES.mediaUploadHttpUnsupported,
    message: 'Browser-local media must be uploaded before an HTTP adapter can persist it.',
    status: 501,
    details: context,
  })
}
