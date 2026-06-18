import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultStoryboardState } from '@/api/storyboard.api'
import { resetLocalState } from '@/api/local'
import { generationApi } from '@/api/modules/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import { videoGenerationService } from './videoGeneration.service'

describe('videoGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('generates a storyboard video through generation tasks', async () => {
    const shot = createDefaultStoryboardState().shots[0]!

    const result = await videoGenerationService.generateVideo({
      projectId: 'video-service-project',
      shot,
    })

    expect(result.shotId).toBe(shot.id)
    expect(result.videoUrl).toContain('mock-video://')
    expect(result.shot.videoUrl).toBe(result.videoUrl)
  })

  it('creates a video task payload with video fields', async () => {
    const shot = createDefaultStoryboardState().shots[0]!
    shot.videoPrompt = 'camera pushes in'
    shot.dialogue = 'line of dialogue'
    shot.durationSeconds = 12

    const pending = videoGenerationService.generateVideo({
      projectId: 'video-service-payload-project',
      shot,
    })

    const tasks = await generationApi.list('video-service-payload-project')
    const task = tasks.find((item) => item.type === 'video')

    expect(task?.payload).toMatchObject({
      shotId: shot.id,
      title: shot.title,
      videoPrompt: 'camera pushes in',
      dialogue: 'line of dialogue',
      durationSeconds: 12,
      voiceAssignments: shot.voiceAssignments ?? [],
    })

    await pending
  })

  it('throws a stable error when video generation fails', async () => {
    const shot = createDefaultStoryboardState().shots[0]!
    shot.title = '#mock-video-fail'

    await expect(
      videoGenerationService.generateVideo({
        projectId: 'video-service-fail-project',
        shot,
      }),
    ).rejects.toThrow(API_ERROR_CODES.videoGenerateFailed)
  })
})
