import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { GenerationTask } from '@/api/modules/generation/generation.types'
import { resolveDubbingMockTask } from '@/api/modules/generation/mock-resolvers/dubbing.mock-resolver'
import { MOCK_MEDIA_AUDIO_URL } from '@/mocks/mockMedia'

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

const makeTask = (overrides: Partial<GenerationTask> = {}): GenerationTask => {
  const card = makeCard()

  return {
    id: 'task-dubbing-1',
    projectId: 'project-1',
    type: 'dubbing',
    status: GENERATION_TASK_STATUSES.queued,
    progress: 0,
    payload: {
      cardId: card.id,
      title: card.title,
      modelId: 'index-tts',
      selectedVoiceId: card.selectedVoiceId,
      lines: card.lines,
      card,
    },
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
    ...overrides,
  }
}

describe('resolveDubbingMockTask', () => {
  it('settles a dubbing task with generated audio lines', async () => {
    const task = makeTask()

    const result = await resolveDubbingMockTask(task)

    expect(result).toMatchObject({
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        cardId: 'card-1',
        lineIds: ['line-1'],
      },
    })
    expect(result?.result).toMatchObject({
      lines: [
        expect.objectContaining({
          id: 'line-1',
          status: 'success',
          audioUrl: MOCK_MEDIA_AUDIO_URL,
        }),
      ],
    })
  })

  it('fails a dubbing task when mock fail conditions are met', async () => {
    const task = makeTask({
      payload: {
        ...makeTask().payload,
        title: '#mock-dubbing-fail',
      },
    })

    const result = await resolveDubbingMockTask(task)

    expect(result).toEqual({
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.dubbingGenerateFailed,
      result: task.result,
    })
  })

  it('fails when the card is missing from payload', async () => {
    const task = makeTask({
      payload: {
        cardId: 'card-1',
        title: '角色A',
        modelId: 'index-tts',
        lines: [],
      },
    })

    const result = await resolveDubbingMockTask(task)

    expect(result).toEqual({
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.dubbingGenerateFailed,
      result: task.result,
    })
  })
})
