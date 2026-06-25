import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLocalState } from '@/api/local'
import { generationApi } from '@/api/modules/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'

const makeCard = (overrides: Partial<DubbingRoleCardModel> = {}): DubbingRoleCardModel => ({
  id: 'card-1',
  title: '角色A',
  imageUrl: 'data:image/png;base64,mock',
  selectedVoiceId: 'voice-1',
  voiceOptions: [{ id: 'voice-1', name: '温柔女声' }],
  createdAt: '2026-03-12 17:16',
  hidden: false,
  lines: [
    {
      id: 'line-1',
      shotId: '101',
      shotLabel: '镜头 1',
      text: '第一句对白',
      status: 'idle',
    },
  ],
  ...overrides,
})

describe('dubbingGenerationService', () => {
  beforeEach(() => {
    resetLocalState()
    vi.resetModules()
  })

  it('generates a dubbing card through generation tasks', async () => {
    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')
    const result = await dubbingGenerationService.generateCard({
      projectId: 'dubbing-service-project',
      modelId: 'index-tts',
      card: makeCard(),
    })

    expect(result.cardId).toBe('card-1')
    expect(result.lineIds).toEqual(['line-1'])
    expect(result.lines[0]?.audioUrl).toContain('data:audio/wav;base64,')
    expect(result.lines[0]?.status).toBe('success')
  })

  it('creates a dubbing task payload with card fields', async () => {
    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')
    const { generationApi } = await import('@/api/modules/generation')
    const card = makeCard()

    const pending = dubbingGenerationService.generateCard({
      projectId: 'dubbing-service-payload-project',
      modelId: 'azure-tts',
      card,
    })

    await Promise.resolve()
    const tasks = await generationApi.list('dubbing-service-payload-project')
    const task = tasks.find((item) => item.type === 'dubbing')

    expect(task?.payload).toMatchObject({
      cardId: card.id,
      title: card.title,
      modelId: 'azure-tts',
      selectedVoiceId: card.selectedVoiceId,
      lines: card.lines,
      card,
    })

    await pending
  })

  it('throws a stable error when dubbing generation fails', async () => {
    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')
    await expect(
      dubbingGenerationService.generateCard({
        projectId: 'dubbing-service-fail-project',
        modelId: 'index-tts',
        card: makeCard({
          title: '#mock-dubbing-fail',
        }),
      }),
    ).rejects.toThrow(API_ERROR_CODES.dubbingGenerateFailed)
  })

  it('uses direct storyboard voice tasks in http mode and maps resultUrl to line audio', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.doMock('@/services/editor/storyboardVoiceTask.service', () => ({
      storyboardVoiceTaskService: {
        createStoryboardVoiceTask: vi.fn().mockResolvedValue({
          id: '10',
          status: 'SUCCESS',
          progress: 100,
          providerTaskId: '',
          resultUrl: '/mock-results/aidrama/tasks/10.mp3',
          errorMessage: '',
        }),
      },
    }))

    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')

    const result = await dubbingGenerationService.generateCard({
      projectId: 'dubbing-service-project',
      modelId: 'index-tts',
      card: makeCard(),
    })

    expect(result.cardId).toBe('card-1')
    expect(result.lines[0]).toMatchObject({
      id: 'line-1',
      audioUrl: '/mock-results/aidrama/tasks/10.mp3',
      status: 'success',
    })
  })

  it('rejects local storyboard lines in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')

    await expect(
      dubbingGenerationService.generateCard({
        projectId: 'dubbing-service-project',
        modelId: 'index-tts',
        card: makeCard({
          lines: [
            {
              id: 'line-1',
              shotId: 'shot-1',
              shotLabel: '镜头 1',
              text: '第一句对白',
              status: 'idle',
            },
          ],
        }),
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardVoiceRequiresPersistedShot)
  })

  it('requires dialogue before voice generation in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    const { dubbingGenerationService } = await import('@/services/generation/dubbingGeneration.service')

    await expect(
      dubbingGenerationService.generateCard({
        projectId: 'dubbing-service-project',
        modelId: 'index-tts',
        card: makeCard({
          lines: [
            {
              id: 'line-1',
              shotId: '101',
              shotLabel: '镜头 1',
              text: '   ',
              status: 'idle',
            },
          ],
        }),
      }),
    ).rejects.toThrow(API_ERROR_CODES.storyboardVoiceDialogueRequired)
  })
})
