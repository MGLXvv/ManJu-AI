import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import { resolveGenerationTaskErrorMessage } from '@/features/editor/generationErrorMessageState'

describe('generationErrorMessageState', () => {
  it('maps not found task errors to user-facing copy', () => {
    expect(resolveGenerationTaskErrorMessage(API_ERROR_CODES.generationTaskNotFound)).toBe('生成任务不存在，请刷新后重试')
  })

  it('maps timeout task errors to user-facing copy', () => {
    expect(resolveGenerationTaskErrorMessage(API_ERROR_CODES.generationTaskTimeout)).toBe(
      '生成任务等待超时，请稍后查看结果或重新生成',
    )
  })

  it('maps cancelled task errors to user-facing copy', () => {
    expect(resolveGenerationTaskErrorMessage(API_ERROR_CODES.generationTaskCancelled)).toBe('生成任务已取消')
  })

  it('maps generic task failure errors to user-facing copy', () => {
    expect(resolveGenerationTaskErrorMessage(API_ERROR_CODES.generationTaskFailed)).toBe('生成任务失败，请稍后再试')
  })

  it('returns null for unknown errors', () => {
    expect(resolveGenerationTaskErrorMessage('UNKNOWN_ERROR')).toBeNull()
  })
})
