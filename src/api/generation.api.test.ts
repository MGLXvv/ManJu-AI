import { describe, expect, it } from 'vitest'
import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { generationApi } from './generation.api'

describe('generation task api', () => {
  it('creates a queued task with backend-ready status fields', async () => {
    const task = await generationApi.create({ projectId: 'p1', type: 'storyboard' })

    expect(task.status).toBe(GENERATION_TASK_STATUSES.queued)
    expect(task.progress).toBe(0)
    expect(task.projectId).toBe('p1')
    expect(task.createdAt).toBeTruthy()
  })

  it('supports task lifecycle actions', async () => {
    const task = await generationApi.create({ projectId: 'p-lifecycle', type: 'video', shotId: 'shot-1' })
    const running = await generationApi.updateStatus(task.id, GENERATION_TASK_STATUSES.running, 40)
    const cancelled = await generationApi.cancel(task.id)
    const retried = await generationApi.retry(task.id)

    expect(running?.status).toBe(GENERATION_TASK_STATUSES.running)
    expect(cancelled?.status).toBe(GENERATION_TASK_STATUSES.cancelled)
    expect(retried?.status).toBe(GENERATION_TASK_STATUSES.queued)
    expect(retried?.progress).toBe(0)
    expect(await generationApi.getById(task.id)).toMatchObject({
      id: task.id,
      projectId: 'p-lifecycle',
      shotId: 'shot-1',
    })
  })

  it('supports storyboard prompt optimization results through task payloads', async () => {
    const task = await generationApi.create({
      projectId: 'p-storyboard-optimize',
      type: 'storyboard_optimize',
      shotId: 'shot-optimize-1',
      payload: {
        prompt: '夜晚街道霓虹灯闪烁，角色在雨中停步回头',
        mode: 'active-shot',
      },
    })

    expect(task.type).toBe('storyboard_optimize')

    const settled = await generationApi.getById(task.id)
    expect(settled?.projectId).toBe('p-storyboard-optimize')
  })

  it('supports storyboard upscale results through task payloads', async () => {
    const task = await generationApi.create({
      projectId: 'p-storyboard-upscale',
      type: 'storyboard_upscale',
      shotId: 'shot-upscale-1',
      payload: {
        shotId: 'shot-upscale-1',
        title: '镜头 1',
        imageUrl: 'data:image/png;base64,source',
        prompt: '夜晚街道霓虹灯闪烁，角色在雨中停步回头',
        style: '国风漫画',
        ratio: '16:9',
        shot: {
          id: 'shot-upscale-1',
          index: 1,
          title: '镜头 1',
          imageUrl: 'data:image/png;base64,source',
          videoUrl: '',
          prompt: '夜晚街道霓虹灯闪烁，角色在雨中停步回头',
          videoPrompt: '',
          dialogue: '',
          durationSeconds: 10,
          voiceAssignments: [],
          attachments: [],
          characters: [],
          scenes: [],
          props: [],
          style: '国风漫画',
          ratio: '16:9',
          status: 'success',
          isHidden: false,
          isFavorite: false,
          isLocked: false,
          createdAt: '2026-03-12 17:16',
          referenceImages: [],
        },
      },
    })

    expect(task.type).toBe('storyboard_upscale')

    const settled = await generationApi.getById(task.id)
    expect(settled?.projectId).toBe('p-storyboard-upscale')
  })

  it('supports setting asset generation results through task payloads', async () => {
    const task = await generationApi.create({
      projectId: 'p-setting-asset',
      type: 'setting_asset',
      payload: {
        assetId: 'asset-1',
        type: 'character',
        name: '角色-男主',
        description: '角色音色',
        prompt: '夜色街道里的角色设定图，电影感光影',
        asset: {
          id: 'asset-1',
          type: 'character',
          title: '角色-男主',
          roleName: '角色音色',
          prompt: '夜色街道里的角色设定图，电影感光影',
          imageUrls: [],
          candidateImages: [],
          selectedVoiceId: 'male-mid-deep',
          voiceOptions: [],
          status: 'empty',
          favorite: false,
          createdAt: '2026-03-12 17:16',
        },
      },
    })

    expect(task.type).toBe('setting_asset')

    const settled = await generationApi.getById(task.id)
    expect(settled?.projectId).toBe('p-setting-asset')
  })

  it('supports video optimize results through task payloads', async () => {
    const task = await generationApi.create({
      projectId: 'p-video-optimize',
      type: 'video_optimize',
      shotId: 'shot-opt-1',
      payload: {
        shotId: 'shot-opt-1',
        mode: 'videoPrompt',
        value: 'night city scene',
      },
    })

    expect(task.type).toBe('video_optimize')

    const settled = await generationApi.getById(task.id)
    expect(settled?.projectId).toBe('p-video-optimize')
  })
})
