import { describe, expect, it } from 'vitest'
import {
  buildVideoBatchGenerateMessage,
  buildVideoGenerateErrorMessage,
  optimizeMockVideoDialogue,
  optimizeMockVideoPrompt,
  shouldMockVideoGenerateFail,
} from './videoGenerationState'

describe('videoGenerationState', () => {
  it('triggers mock failure when title, prompt, or dialogue contains the fail token', () => {
    expect(shouldMockVideoGenerateFail({ title: '#mock-video-fail', videoPrompt: '正常视频提示词', dialogue: '正常对白' })).toBe(true)
    expect(shouldMockVideoGenerateFail({ title: '镜头 1', videoPrompt: '#mock-video-fail', dialogue: '正常对白' })).toBe(true)
    expect(shouldMockVideoGenerateFail({ title: '镜头 1', videoPrompt: '正常视频提示词', dialogue: '#mock-video-fail' })).toBe(true)
    expect(shouldMockVideoGenerateFail({ title: '镜头 1', videoPrompt: '正常视频提示词', dialogue: '正常对白' })).toBe(false)
  })

  it('maps stable generate errors to user-facing copy', () => {
    expect(buildVideoGenerateErrorMessage('VIDEO_GENERATE_FAILED')).toBe('视频生成失败，请调整提示词后重试')
    expect(buildVideoGenerateErrorMessage('VIDEO_OPTIMIZE_FAILED')).toBe('AI优化失败，请稍后再试')
    expect(buildVideoGenerateErrorMessage('UNKNOWN_ERROR')).toBe('视频生成失败，请稍后再试')
  })

  it('builds batch generate summary copy for success, partial failure, and full failure', () => {
    expect(buildVideoBatchGenerateMessage({ successCount: 3, failedCount: 0 })).toBe('已完成 3 个视频镜头的批量生成')
    expect(buildVideoBatchGenerateMessage({ successCount: 2, failedCount: 1 })).toBe('批量生成完成：成功 2 个，失败 1 个')
    expect(buildVideoBatchGenerateMessage({ successCount: 0, failedCount: 2 })).toBe('视频批量生成失败，请调整提示词后重试')
  })

  it('optimizes video prompt and dialogue with mock helpers', async () => {
    await expect(optimizeMockVideoPrompt('镜头提示词')).resolves.toContain('镜头运动更明确')
    await expect(optimizeMockVideoDialogue('对白内容')).resolves.toContain('情绪更集中')
  })

  it('surfaces stable optimize failure code for prompt and dialogue', async () => {
    await expect(optimizeMockVideoPrompt('#mock-optimize-fail')).rejects.toThrow('VIDEO_OPTIMIZE_FAILED')
    await expect(optimizeMockVideoDialogue('#mock-optimize-fail')).rejects.toThrow('VIDEO_OPTIMIZE_FAILED')
  })
})
