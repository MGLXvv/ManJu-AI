import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import {
  buildDubbingBatchGenerateMessage,
  buildDubbingGenerateErrorMessage,
  shouldMockDubbingGenerateFail,
} from './dubbingGenerationState'

describe('dubbingGenerationState', () => {
  it('triggers mock failure when title or line text contains the fail token', () => {
    expect(shouldMockDubbingGenerateFail({ title: '#mock-dubbing-fail', lines: ['正常对白'] })).toBe(true)
    expect(shouldMockDubbingGenerateFail({ title: '赵灵儿', lines: ['#mock-dubbing-fail'] })).toBe(true)
    expect(shouldMockDubbingGenerateFail({ title: '赵灵儿', lines: ['正常对白'] })).toBe(false)
  })

  it('maps stable generate errors to user-facing copy', () => {
    expect(buildDubbingGenerateErrorMessage(API_ERROR_CODES.dubbingGenerateFailed)).toBe('配音生成失败，请调整对白后重试')
    expect(buildDubbingGenerateErrorMessage('UNKNOWN_ERROR')).toBe('配音生成失败，请稍后再试')
  })

  it('maps generic task errors before falling back to dubbing copy', () => {
    expect(buildDubbingGenerateErrorMessage(API_ERROR_CODES.generationTaskNotFound)).toBe('生成任务不存在，请刷新后重试')
  })

  it('builds batch generate summary copy for success, partial failure, and full failure', () => {
    expect(buildDubbingBatchGenerateMessage({ successCount: 3, failedCount: 0 })).toBe('已完成 3 个角色的批量配音')
    expect(buildDubbingBatchGenerateMessage({ successCount: 2, failedCount: 1 })).toBe('批量配音完成：成功 2 个，失败 1 个')
    expect(buildDubbingBatchGenerateMessage({ successCount: 0, failedCount: 2 })).toBe('批量配音失败，请调整对白后重试')
  })
})
