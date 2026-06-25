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
