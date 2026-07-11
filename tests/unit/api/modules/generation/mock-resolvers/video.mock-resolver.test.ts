import { describe, expect, it } from 'vitest'
import { createDefaultStoryboardState } from '@/api/storyboard.api'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { GenerationTask } from '@/api/modules/generation/generation.types'
import { resolveVideoMockTask } from '@/api/modules/generation/mock-resolvers/video.mock-resolver'
import { MOCK_MEDIA_VIDEO_16_9_URL } from '@/mocks/mockMedia'

const makeTask = (overrides: Partial<GenerationTask> = {}): GenerationTask => {
  const shot = createDefaultStoryboardState().shots[0]!

  return {
    id: 'task-video-1',
    projectId: 'project-1',
    type: 'video',
    shotId: shot.id,
    status: GENERATION_TASK_STATUSES.queued,
    progress: 0,
    payload: {
      shotId: shot.id,
      title: shot.title,
      imageUrl: shot.imageUrl,
      videoPrompt: shot.videoPrompt ?? '',
      dialogue: shot.dialogue ?? '',
      durationSeconds: shot.durationSeconds ?? 10,
      voiceAssignments: shot.voiceAssignments ?? [],
      characters: shot.characters,
      scenes: shot.scenes,
      props: shot.props,
      style: shot.style,
      ratio: shot.ratio,
      shot,
    },
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T00:00:00.000Z',
    ...overrides,
  }
}

describe('resolveVideoMockTask', () => {
  it('settles a video task with video result data', async () => {
    const task = makeTask()

    const result = await resolveVideoMockTask(task)

    expect(result).toMatchObject({
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        shotId: task.shotId,
      },
    })
    expect(result?.result).toMatchObject({
      videoUrl: MOCK_MEDIA_VIDEO_16_9_URL,
      shot: expect.objectContaining({
        id: task.shotId,
      }),
    })
  })

  it('fails a video task when mock fail conditions are met', async () => {
    const task = makeTask({
      payload: {
        ...makeTask().payload,
        title: '#mock-video-fail',
      },
    })

    const result = await resolveVideoMockTask(task)

    expect(result).toEqual({
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.videoGenerateFailed,
      result: task.result,
    })
  })

  it('fails when the target shot is missing from payload', async () => {
    const task = makeTask({
      payload: {
        shotId: 'shot-1',
        title: 'Shot 1',
      },
    })

    const result = await resolveVideoMockTask(task)

    expect(result).toEqual({
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.videoGenerateFailed,
      result: task.result,
    })
  })

  it('optimizes video prompt payloads through the video optimize task', async () => {
    const task = makeTask({
      type: 'video_optimize',
      payload: {
        shotId: 'shot-1',
        mode: 'videoPrompt',
        value: 'night city scene',
      },
    })

    const result = await resolveVideoMockTask(task)

    expect(result).toMatchObject({
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        value: expect.stringContaining('镜头运动更明确'),
      },
    })
  })

  it('optimizes dialogue payloads through the video optimize task', async () => {
    const task = makeTask({
      type: 'video_optimize',
      payload: {
        shotId: 'shot-1',
        mode: 'dialogue',
        value: 'spoken line',
      },
    })

    const result = await resolveVideoMockTask(task)

    expect(result).toMatchObject({
      status: GENERATION_TASK_STATUSES.success,
      progress: 100,
      result: {
        value: expect.stringContaining('情绪更集中'),
      },
    })
  })

  it('fails video optimize tasks when optimize mock fails', async () => {
    const task = makeTask({
      type: 'video_optimize',
      payload: {
        shotId: 'shot-1',
        mode: 'videoPrompt',
        value: '#mock-optimize-fail',
      },
    })

    const result = await resolveVideoMockTask(task)

    expect(result).toEqual({
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.videoOptimizeFailed,
      result: task.result,
    })
  })
})
