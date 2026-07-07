import { describe, expect, it } from 'vitest'
import {
  isLocalStoryboardShotId,
  mapBackendStoryboardToShot,
  mapBackendStoryboardWorkspaceToDraftPatch,
  mapShotToBackendStoryboardPayload,
  resolveBackendStoryboardList,
} from '@/api/modules/editor/storyboard.mapper'

describe('storyboard.mapper', () => {
  it('maps storyboards into draft shots', () => {
    const patch = mapBackendStoryboardWorkspaceToDraftPatch({
      storyboards: [
        {
          id: 101,
          title: '镜头一',
          content: '主角走入废墟',
          durationSeconds: 8,
          index: 1,
          createTime: '2026-06-25T10:00:00.000Z',
        },
      ],
    })

    expect(patch.shots).toHaveLength(1)
    expect(patch.shots[0].id).toBe('101')
    expect(patch.shots[0].title).toBe('镜头一')
    expect(patch.shots[0].description).toBe('主角走入废墟')
    expect(patch.shots[0].durationSeconds).toBe(8)
  })

  it('maps backend storyboard ratio from aspectRatio and ratio fields', () => {
    const portraitFromAspect = mapBackendStoryboardToShot(
      { id: 1, aspectRatio: '9:16', content: '竖版镜头' },
      1,
    )
    const portraitFromRatio = mapBackendStoryboardToShot(
      { id: 2, ratio: '9:16', content: '竖版镜头' },
      2,
    )

    expect(portraitFromAspect.ratio).toBe('9:16')
    expect(portraitFromRatio.ratio).toBe('9:16')
  })

  it('marks backend shots with image urls as success', () => {
    const shot = mapBackendStoryboardToShot(
      { id: 3, content: '已有首帧', imageUrl: 'https://example.com/shot.png' },
      1,
    )

    expect(shot.status).toBe('success')
  })

  it('maps backend storyboard status values when image is absent', () => {
    expect(mapBackendStoryboardToShot({ id: 4, content: '处理中', status: 'processing' }, 1).status).toBe('generating')
    expect(mapBackendStoryboardToShot({ id: 5, content: '失败', status: 'failed' }, 1).status).toBe('failed')
    expect(mapBackendStoryboardToShot({ id: 6, content: '待审核', status: 'pending' }, 1).status).toBe('pending-review')
  })

  it('falls back to list and sortOrder fields', () => {
    const list = resolveBackendStoryboardList({
      list: [{ id: 'shot-2', sortOrder: 2, description: '备用字段' }],
    })

    expect(list).toHaveLength(1)

    const shot = mapBackendStoryboardToShot(
      { id: 'shot-2', sortOrder: 2, description: '备用字段' },
      2,
    )

    expect(shot.id).toBe('shot-2')
    expect(shot.index).toBe(2)
    expect(shot.description).toBe('备用字段')
  })

  it('maps backend sort field to shot index', () => {
    const shot = mapBackendStoryboardToShot(
      { id: 9, sort: 3, content: '后端返回排序字段' },
      1,
    )

    expect(shot.index).toBe(3)
    expect(shot.description).toBe('后端返回排序字段')
  })

  it('maps storyboard shot fields to backend save payload', () => {
    const payload = mapShotToBackendStoryboardPayload({
      id: 'shot-local-1',
      index: 1,
      title: '镜头标题',
      prompt: '镜头描述内容',
      characters: [],
      scenes: [],
      props: [],
      style: '写实',
      ratio: '16:9',
      status: 'pending-review',
      referenceImages: [],
      createdAt: '2026-06-25T00:00:00.000Z',
    })

    expect(payload).toEqual({
      title: '镜头标题',
      content: '镜头描述内容',
      durationSeconds: 5,
    })
  })

  it('detects local storyboard shot ids', () => {
    expect(isLocalStoryboardShotId('shot-123')).toBe(true)
    expect(isLocalStoryboardShotId('12')).toBe(false)
  })

  it('returns empty shots when no backend storyboard list exists', () => {
    const patch = mapBackendStoryboardWorkspaceToDraftPatch({})
    expect(patch.shots).toEqual([])
  })
})