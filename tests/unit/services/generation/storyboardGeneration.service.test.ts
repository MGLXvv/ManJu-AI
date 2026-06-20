import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultStoryboardState } from '@/api/storyboard.api'
import { resetLocalState } from '@/api/local'
import { API_ERROR_CODES } from '@/types/api-enums'
import { storyboardGenerationService } from '@/services/generation/storyboardGeneration.service'

describe('storyboardGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('generates a storyboard shot image through generation tasks', async () => {
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
    const shot = createDefaultStoryboardState().shots[0]!
    shot.title = '#mock-upscale-fail'

    await expect(
      storyboardGenerationService.upscaleShotImage({
        projectId: 'storyboard-service-project',
        shot,
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardUpscaleFailed)
  })
})
