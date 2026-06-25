import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultStoryboardState } from '@/api/storyboard.api'
import { resetLocalState } from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'

describe('storyboardGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
    vi.resetModules()
  })

  it('generates a storyboard shot image through generation tasks', async () => {
    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!

    const result = await storyboardGenerationService.generateShotImage({
      projectId: 'storyboard-service-project',
      shot,
    })

    expect(result.shotId).toBe(shot.id)
    expect(result.imageUrl).toContain('data:image/svg+xml')
    expect(result.shot.imageUrl).toBe(result.imageUrl)
    expect(result.shot.status).toBe('success')
  })

  it('throws a stable error when storyboard generation fails', async () => {
    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!
    shot.prompt = '#mock-shot-fail'

    await expect(
      storyboardGenerationService.generateShotImage({
        projectId: 'storyboard-service-project',
        shot,
      }),
    ).rejects.toThrow('STORYBOARD_GENERATE_FAILED')
  })

  it('upscales a storyboard shot image through generation tasks', async () => {
    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!

    const result = await storyboardGenerationService.upscaleShotImage({
      projectId: 'storyboard-service-project',
      shot,
    })

    expect(result.shotId).toBe(shot.id)
    expect(result.imageUrl).toContain('data:image/svg+xml')
    expect(result.shot.imageUrl).toBe(result.imageUrl)
    expect(result.shot.status).toBe('success')
  })

  it('throws a stable error when storyboard upscale fails', async () => {
    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')
    const shot = createDefaultStoryboardState().shots[0]!
    shot.title = '#mock-upscale-fail'

    await expect(
      storyboardGenerationService.upscaleShotImage({
        projectId: 'storyboard-service-project',
        shot,
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardUpscaleFailed)
  })

  it('uses direct storyboard image task generation in http mode and refreshes workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = {
      ...createDefaultStoryboardState().shots[0]!,
      id: '101',
    }
    const refreshedShot = {
      ...shot,
      imageUrl: '/mock-results/aidrama/tasks/6.png',
      status: 'success' as const,
    }

    vi.doMock('@/services/editor/storyboardImageTask.service', () => ({
      storyboardImageTaskService: {
        createStoryboardImageTask: vi.fn().mockResolvedValue({
          id: '6',
          status: 'SUCCESS',
          progress: 100,
          providerTaskId: '',
          resultUrl: '/mock-results/aidrama/tasks/6.png',
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

    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')

    const result = await storyboardGenerationService.generateShotImage({
      projectId: 'storyboard-service-project',
      shot,
    })

    expect(result).toMatchObject({
      shotId: shot.id,
      imageUrl: '/mock-results/aidrama/tasks/6.png',
      shot: refreshedShot,
    })
  })

  it('rejects local storyboard shots in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const shot = createDefaultStoryboardState().shots[0]!

    const { storyboardGenerationService } = await import('@/services/generation/storyboardGeneration.service')

    await expect(
      storyboardGenerationService.generateShotImage({
        projectId: 'storyboard-service-project',
        shot,
      }),
    ).rejects.toThrow('STORYBOARD_IMAGE_REQUIRES_PERSISTED_SHOT')
  })
})
