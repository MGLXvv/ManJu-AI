import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { generationApi } from '@/api/modules/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import { videoPromptService } from '@/services/generation/videoPrompt.service'

describe('videoPromptService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('optimizes video prompt through generation tasks', async () => {
    const pending = videoPromptService.optimizeVideoPrompt({
      projectId: 'video-optimize-project',
      shotId: 'shot-1',
      prompt: 'night city scene',
    })

    const tasks = await generationApi.list('video-optimize-project')
    const task = tasks.find((item) => item.type === 'video_optimize')

    expect(task?.payload).toMatchObject({
      shotId: 'shot-1',
      mode: 'videoPrompt',
      value: 'night city scene',
    })

    const result = await pending
    expect(result.value).toContain('镜头运动更明确')
  })

  it('optimizes dialogue through generation tasks', async () => {
    const pending = videoPromptService.optimizeDialogue({
      projectId: 'video-dialogue-project',
      shotId: 'shot-2',
      dialogue: 'original dialogue',
    })

    const tasks = await generationApi.list('video-dialogue-project')
    const task = tasks.find((item) => item.type === 'video_optimize')

    expect(task?.payload).toMatchObject({
      shotId: 'shot-2',
      mode: 'dialogue',
      value: 'original dialogue',
    })

    const result = await pending
    expect(result.value).toContain('情绪更集中')
  })

  it('throws a stable error when video optimize fails', async () => {
    await expect(
      videoPromptService.optimizeVideoPrompt({
        projectId: 'video-optimize-fail-project',
        shotId: 'shot-3',
        prompt: '#mock-optimize-fail',
      }),
    ).rejects.toThrow(API_ERROR_CODES.videoOptimizeFailed)
  })
})
