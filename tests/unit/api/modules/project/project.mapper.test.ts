import { describe, expect, it } from 'vitest'
import {
  mapBackendProjectListQuery,
  mapBackendProjectToProject,
  mapCreateProjectInputToBackendPayload,
  mapUpdateProjectInputToBackendPayload,
} from '@/api/modules/project/project.mapper'

describe('project mapper', () => {
  it('maps backend project dto to a stable frontend project', () => {
    const project = mapBackendProjectToProject({
      id: 12,
      name: 'Backend Demo',
      status: 'COMPLETED',
      currentStep: 'video',
      aspectRatio: '9:16',
      style: '写实',
      durationSeconds: 75,
      coverUrl: 'https://example.com/cover.png',
      createTime: '2026-06-24 10:00:00',
      updateTime: '2026-06-24 11:00:00',
    })

    expect(project).toEqual({
      id: '12',
      name: 'Backend Demo',
      status: 'completed',
      currentStep: 'video',
      ratio: '9:16',
      style: '写实',
      updatedAt: '2026-06-24 11:00:00',
      duration: '75s',
      coverUrl: 'https://example.com/cover.png',
      favorite: false,
    })
  })

  it('falls back to conservative defaults for unknown backend values', () => {
    const project = mapBackendProjectToProject({
      id: 'abc',
      name: 'Unknown Demo',
      status: 'WAITING',
      currentStep: 'unknown-step',
      aspectRatio: '1:1',
      createTime: '2026-06-24 09:00:00',
    })

    expect(project).toMatchObject({
      id: 'abc',
      status: 'in_progress',
      currentStep: 'script',
      ratio: '16:9',
      style: 'anime',
      updatedAt: '2026-06-24 09:00:00',
      favorite: false,
    })
  })

  it('maps completed backend status to complete step when currentStep is missing', () => {
    const project = mapBackendProjectToProject({
      id: 9,
      name: 'Done Demo',
      status: 'completed',
    })

    expect(project.status).toBe('completed')
    expect(project.currentStep).toBe('complete')
  })

  it('maps frontend list query to backend query params', () => {
    expect(
      mapBackendProjectListQuery({
        page: 2,
        pageSize: 20,
        keyword: 'hero',
        status: 'in_progress',
      }),
    ).toEqual({
      pageNo: 2,
      pageSize: 20,
      keyword: 'hero',
      status: 'IN_PROGRESS',
    })
  })

  it('maps create input to backend payload defaults', () => {
    expect(
      mapCreateProjectInputToBackendPayload({
        name: 'New Demo',
        ratio: '16:9',
        style: '',
      }),
    ).toEqual({
      name: 'New Demo',
      description: '',
      aspectRatio: '16:9',
      style: 'anime',
      language: 'zh-CN',
      durationSeconds: 60,
    })
  })

  it('maps update input to backend payload and drops frontend-only fields', () => {
    expect(
      mapUpdateProjectInputToBackendPayload({
        id: 'p-1',
        status: 'completed',
        currentStep: 'complete',
        favorite: true,
        name: 'Renamed Demo',
      }),
    ).toEqual({
      name: 'Renamed Demo',
      status: 'COMPLETED',
    })
  })
})
