import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultStoryboardState } from '@/api/storyboard.api'
import { resetLocalState } from '@/api/local'
import { MOCK_MEDIA_VIDEO_16_9_URL } from '@/mocks/mockMedia'
import { API_ERROR_CODES } from '@/types/api-enums'

describe('videoGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
    vi.resetModules()
  })

  it('generates a storyboard video through generation tasks', async () => {
    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!

    const result = await videoGenerationService.generateVideo({
      projectId: 'video-service-project',
      shot,
    })

    expect(result.shotId).toBe(shot.id)
    expect(result.videoUrl).toBe(MOCK_MEDIA_VIDEO_16_9_URL)
    expect(result.shot.videoUrl).toBe(result.videoUrl)
  })

  it('creates a video task payload with video fields', async () => {
    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')
    const { generationApi } = await import('@/api/modules/generation')
    const shot = createDefaultStoryboardState().shots[0]!
    shot.videoPrompt = 'camera pushes in'
    shot.dialogue = 'line of dialogue'
    shot.durationSeconds = 12

    const pending = videoGenerationService.generateVideo({
      projectId: 'video-service-payload-project',
      shot,
    })

    await Promise.resolve()
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
    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!
    shot.title = '#mock-video-fail'

    await expect(
      videoGenerationService.generateVideo({
        projectId: 'video-service-fail-project',
        shot,
      }),
    ).rejects.toThrow(API_ERROR_CODES.videoGenerateFailed)
  })

  it('uses direct storyboard video task generation in http mode and refreshes workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = {
      ...createDefaultStoryboardState().shots[0]!,
      id: '101',
      imageUrl: '/mock-results/aidrama/tasks/6.png',
    }
    const refreshedShot = {
      ...shot,
      videoUrl: '/mock-results/aidrama/tasks/8.mp4',
      status: 'success' as const,
    }

    vi.doMock('@/services/editor/storyboardVideoTask.service', () => ({
      storyboardVideoTaskService: {
        createStoryboardVideoTask: vi.fn().mockResolvedValue({
          id: '8',
          status: 'SUCCESS',
          progress: 100,
          providerTaskId: '',
          resultUrl: '/mock-results/aidrama/tasks/8.mp4',
          errorMessage: '',
        }),
      },
    }))

    vi.doMock('@/services/editor/storyboardWorkflow.service', () => ({
      storyboardWorkflowService: {
        loadStoryboardWorkspace: vi.fn().mockResolvedValue({
          shots: [refreshedShot],
        }),
      },
    }))

    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')

    const result = await videoGenerationService.generateVideo({
      projectId: 'video-service-project',
      shot,
    })

    expect(result).toMatchObject({
      shotId: shot.id,
      videoUrl: '/mock-results/aidrama/tasks/8.mp4',
      shot: refreshedShot,
    })
  })

  it('falls back to task resultUrl when workspace has no videoUrl', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = {
      ...createDefaultStoryboardState().shots[0]!,
      id: '101',
      imageUrl: '/mock-results/aidrama/tasks/6.png',
    }

    vi.doMock('@/services/editor/storyboardVideoTask.service', () => ({
      storyboardVideoTaskService: {
        createStoryboardVideoTask: vi.fn().mockResolvedValue({
          id: '8',
          status: 'SUCCESS',
          progress: 100,
          providerTaskId: '',
          resultUrl: '/mock-results/aidrama/tasks/8.mp4',
          errorMessage: '',
        }),
      },
    }))

    vi.doMock('@/services/editor/storyboardWorkflow.service', () => ({
      storyboardWorkflowService: {
        loadStoryboardWorkspace: vi.fn().mockResolvedValue({
          shots: [{ ...shot, videoUrl: '', status: 'pending-review' as const }],
        }),
      },
    }))

    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')

    const result = await videoGenerationService.generateVideo({
      projectId: 'video-service-project',
      shot,
    })

    expect(result.videoUrl).toBe('/mock-results/aidrama/tasks/8.mp4')
    expect(result.shot.videoUrl).toBe('/mock-results/aidrama/tasks/8.mp4')
  })

  it('rejects local storyboard shots in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = {
      ...createDefaultStoryboardState().shots[0]!,
      imageUrl: '/mock-results/aidrama/tasks/6.png',
    }

    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')

    await expect(
      videoGenerationService.generateVideo({
        projectId: 'video-service-project',
        shot,
      }),
    ).rejects.toThrow('STORYBOARD_VIDEO_REQUIRES_PERSISTED_SHOT')
  })

  it('requires an existing image before video generation in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = {
      ...createDefaultStoryboardState().shots[0]!,
      id: '101',
      imageUrl: '',
    }

    const { videoGenerationService } = await import('@/services/generation/videoGeneration.service')

    await expect(
      videoGenerationService.generateVideo({
        projectId: 'video-service-project',
        shot,
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardVideoImageRequired)
  })
})
