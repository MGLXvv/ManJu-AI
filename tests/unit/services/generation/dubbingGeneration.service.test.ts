import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { generationApi } from '@/api/modules/generation'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import { dubbingGenerationService } from '@/services/generation/dubbingGeneration.service'

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
      shotId: 'shot-1',
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
  })

  it('generates a dubbing card through generation tasks', async () => {
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
    const card = makeCard()

    const pending = dubbingGenerationService.generateCard({
      projectId: 'dubbing-service-payload-project',
      modelId: 'azure-tts',
      card,
    })

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
})
